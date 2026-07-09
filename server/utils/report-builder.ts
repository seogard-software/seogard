import type { ReportAnnexPage, ReportRuleEntry, ReportSeverity, ZoneReport } from '../../shared/types/zone-report'
import type { Locale } from '../../shared/utils/i18n'
import { DEFAULT_LOCALE } from '../../shared/utils/i18n'
import { getAlertTypeLabels, getRuleCategory } from '../../shared/utils/constants'
import { getRuleKnowledge } from '../../shared/utils/rule-knowledge'
import { RULES } from '../../shared/utils/rules-catalog'
import { t } from './i18n'

// Construit le rapport « État de santé SEO » d'une zone — FONCTION PURE :
// aucune requête DB, aucune date implicite (generatedAt fourni par l'appelant).
// Consommée par les endpoints .md / .pdf et la page dashboard.

export interface ReportCaps {
  /** URLs d'échantillon par règle dans le sommaire. */
  SAMPLE_URLS: number
  /** Pages détaillées en annexe (les plus touchées d'abord). */
  ANNEX_PAGES: number
  /** Alertes détaillées par page d'annexe. */
  ANNEX_RULES_PER_PAGE: number
  /** Troncature des preuves avant/après. */
  PROOF_CHARS: number
}

/** Caps des sorties HUMAINES (PDF) : un document se lit, il ne s'exhaustive pas. */
export const REPORT_CAPS: ReportCaps = {
  SAMPLE_URLS: 20,
  ANNEX_PAGES: 30,
  ANNEX_RULES_PER_PAGE: 5,
  PROOF_CHARS: 120,
}

/**
 * Caps du .md : EXHAUSTIF (toutes les règles, toutes les URLs). Plus de limite 16 Mo car le
 * fichier est stocké dans le stockage objet (R2/S3), pas dans un document Mongo.
 */
export const MD_REPORT_CAPS: ReportCaps = {
  SAMPLE_URLS: Number.POSITIVE_INFINITY,
  ANNEX_PAGES: Number.POSITIVE_INFINITY,
  ANNEX_RULES_PER_PAGE: Number.POSITIVE_INFINITY,
  PROOF_CHARS: 200,
}

/** Rétention des rapports figés : au-delà de cet âge, ils sont purgés (doc + fichiers R2). */
export const REPORT_RETENTION_DAYS = 90

const SEVERITY_WEIGHT: Record<ReportSeverity, number> = { critical: 3, warning: 2, info: 1 }

// Règles site-level (1 occurrence = tout le site) — depuis le catalogue, source unique.
const SITE_LEVEL_RULES = new Set(RULES.filter(r => r.type === 'site-level').map(r => r.id))

/** La ligne signature : écart entre HTML brut et rendu (hors ssr_blocked = WAF, pas un écart de contenu). */
export function isSignatureRule(ruleId: string): boolean {
  if (ruleId === 'ssr_blocked') return false
  return ruleId.startsWith('ssr_') || ruleId.endsWith('_in_ssr')
}

export interface ReportAlertInput {
  ruleId: string
  pageUrl: string
  severity: ReportSeverity
  message: string
  previousValue?: string | null
  currentValue?: string | null
}

export interface BuildZoneReportInput {
  site: { name: string, domain: string }
  zone: { name: string | null, isDefault: boolean }
  crawl: { completedAt: string | null, pagesScanned: number, pagesTotal: number, pagesPurged?: number } | null
  openAlerts: ReportAlertInput[]
  repairedAlerts: { ruleId: string, pageUrl: string }[]
  generatedAt: string
  /** Langue du rapport (labels de règles, fiches, libellés) — défaut fr. */
  locale?: Locale
}

function truncate(value: string | null | undefined, max: number): string | null {
  if (value === null || value === undefined || value === '') return null
  return value.length > max ? `${value.slice(0, max)}…` : value
}

/** Groupe des alertes par (ruleId, severity) en entrées de sommaire triées par nb de pages décroissant. */
function toRuleEntries(alerts: ReportAlertInput[], caps: ReportCaps, labels: Record<string, string>, locale: Locale): ReportRuleEntry[] {
  const byKey = new Map<string, { ruleId: string, severity: ReportSeverity, pages: Set<string> }>()
  for (const alert of alerts) {
    const key = `${alert.ruleId}|${alert.severity}`
    let group = byKey.get(key)
    if (!group) {
      group = { ruleId: alert.ruleId, severity: alert.severity, pages: new Set() }
      byKey.set(key, group)
    }
    group.pages.add(alert.pageUrl)
  }

  const entries = [...byKey.values()].map((group) => {
    const urls = [...group.pages].sort()
    return {
      ruleId: group.ruleId,
      label: labels[group.ruleId] || group.ruleId,
      severity: group.severity,
      pagesCount: urls.length,
      sampleUrls: Number.isFinite(caps.SAMPLE_URLS) ? urls.slice(0, caps.SAMPLE_URLS) : urls,
      extraPagesCount: Number.isFinite(caps.SAMPLE_URLS) ? Math.max(0, urls.length - caps.SAMPLE_URLS) : 0,
      siteLevel: SITE_LEVEL_RULES.has(group.ruleId),
      knowledge: getRuleKnowledge(group.ruleId, locale),
    }
  })

  entries.sort((a, b) => b.pagesCount - a.pagesCount || a.label.localeCompare(b.label))
  return entries
}

export function buildZoneReport(input: BuildZoneReportInput, caps: ReportCaps = REPORT_CAPS): ZoneReport {
  const locale = input.locale ?? DEFAULT_LOCALE
  const labels = getAlertTypeLabels(locale)
  const ruleLabel = (ruleId: string): string => labels[ruleId] || ruleId

  const regressionAlerts = input.openAlerts.filter(a => getRuleCategory(a.ruleId) !== 'recommendation')
  const recommendationAlerts = input.openAlerts.filter(a => getRuleCategory(a.ruleId) === 'recommendation')

  // ── Verdict ──
  const counts = { critical: 0, warning: 0, info: 0 }
  for (const alert of regressionAlerts) counts[alert.severity]++

  const signaturePages = new Set<string>()
  for (const alert of input.openAlerts) {
    if (isSignatureRule(alert.ruleId)) signaturePages.add(alert.pageUrl)
  }

  // ── Régressions par sévérité ──
  const regressionEntries = toRuleEntries(regressionAlerts, caps, labels, locale)
  const regressions: Record<ReportSeverity, ReportRuleEntry[]> = {
    critical: regressionEntries.filter(e => e.severity === 'critical'),
    warning: regressionEntries.filter(e => e.severity === 'warning'),
    info: regressionEntries.filter(e => e.severity === 'info'),
  }

  // ── Réparées dans le dernier crawl ──
  const repairedByRule = new Map<string, Set<string>>()
  for (const alert of input.repairedAlerts) {
    if (!repairedByRule.has(alert.ruleId)) repairedByRule.set(alert.ruleId, new Set())
    repairedByRule.get(alert.ruleId)!.add(alert.pageUrl)
  }
  const repaired = [...repairedByRule.entries()]
    .map(([ruleId, pages]) => ({ ruleId, label: ruleLabel(ruleId), pagesCount: pages.size }))
    .sort((a, b) => b.pagesCount - a.pagesCount || a.label.localeCompare(b.label))

  // ── Recommandations : site-level d'abord, puis par nb de pages ──
  const recommendationEntries = toRuleEntries(recommendationAlerts, caps, labels, locale)
  const recommendations = [
    ...recommendationEntries.filter(e => e.siteLevel),
    ...recommendationEntries.filter(e => !e.siteLevel),
  ]

  // ── Annexe par page (pages les plus touchées d'abord) ──
  const byPage = new Map<string, { url: string, alerts: ReportAlertInput[], weight: number }>()
  for (const alert of input.openAlerts) {
    let page = byPage.get(alert.pageUrl)
    if (!page) {
      page = { url: alert.pageUrl, alerts: [], weight: 0 }
      byPage.set(alert.pageUrl, page)
    }
    page.alerts.push(alert)
    page.weight += SEVERITY_WEIGHT[alert.severity]
  }
  const sortedPages = [...byPage.values()].sort((a, b) => b.weight - a.weight || a.url.localeCompare(b.url))
  const annexPages = Number.isFinite(caps.ANNEX_PAGES) ? sortedPages.slice(0, caps.ANNEX_PAGES) : sortedPages
  const annex: ReportAnnexPage[] = annexPages.map((page) => {
    const sorted = [...page.alerts].sort((a, b) =>
      SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity] || a.ruleId.localeCompare(b.ruleId))
    return {
      url: page.url,
      alerts: (Number.isFinite(caps.ANNEX_RULES_PER_PAGE) ? sorted.slice(0, caps.ANNEX_RULES_PER_PAGE) : sorted).map(alert => ({
        ruleId: alert.ruleId,
        label: ruleLabel(alert.ruleId),
        severity: alert.severity,
        message: alert.message,
        previous: truncate(alert.previousValue, caps.PROOF_CHARS),
        current: truncate(alert.currentValue, caps.PROOF_CHARS),
      })),
      extraAlertsCount: Number.isFinite(caps.ANNEX_RULES_PER_PAGE) ? Math.max(0, sorted.length - caps.ANNEX_RULES_PER_PAGE) : 0,
    }
  })

  return {
    meta: {
      siteName: input.site.name,
      siteDomain: input.site.domain,
      zoneName: input.zone.isDefault ? t(locale, 'report.zone_default') : (input.zone.name ?? t(locale, 'report.zone_unnamed')),
      zoneIsDefault: input.zone.isDefault,
      crawlCompletedAt: input.crawl?.completedAt ?? null,
      pagesScanned: input.crawl?.pagesScanned ?? 0,
      pagesTotal: input.crawl?.pagesTotal ?? 0,
      pagesPurged: input.crawl?.pagesPurged ?? 0,
      generatedAt: input.generatedAt,
      locale,
    },
    verdict: {
      ...counts,
      recommendations: recommendationEntries.reduce((sum, e) => sum + e.pagesCount, 0),
      signaturePagesCount: signaturePages.size,
      status: counts.critical > 0 ? 'critical' : counts.warning > 0 ? 'warning' : 'ok',
    },
    regressions,
    repaired,
    recommendations,
    annex,
    annexExtraPagesCount: Number.isFinite(caps.ANNEX_PAGES) ? Math.max(0, sortedPages.length - caps.ANNEX_PAGES) : 0,
  }
}
