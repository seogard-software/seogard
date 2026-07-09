import type { RuleKnowledge } from '../utils/rule-knowledge'
import type { Locale } from '../utils/i18n'

// Contrat du rapport « État de santé SEO » d'une zone. Produit par
// server/utils/report-builder.ts (fonction pure), consommé par les
// endpoints .md / .pdf et la page dashboard — une seule vérité.

export type ReportSeverity = 'critical' | 'warning' | 'info'

export interface ZoneReportMeta {
  siteName: string
  siteDomain: string
  zoneName: string
  zoneIsDefault: boolean
  /** Date du dernier crawl terminé (ISO) — null si la zone n'a jamais été crawlée. */
  crawlCompletedAt: string | null
  pagesScanned: number
  pagesTotal: number
  /** Pages sorties du monitoring par la purge (410 + hors sitemap au-delà de la fenêtre). */
  pagesPurged: number
  /** Date de génération du rapport (ISO) — fournie par l'appelant (pureté). */
  generatedAt: string
  /** Langue du rapport (libellés, dates) — figée à la génération, portée par le rapport lui-même. */
  locale: Locale
}

export interface ZoneReportVerdict {
  critical: number
  warning: number
  info: number
  recommendations: number
  /** Pages distinctes où le HTML brut diffère du rendu (règles ssr_* + *_in_ssr) — la ligne signature. */
  signaturePagesCount: number
  /** Badge global : critical > 0 → critical ; sinon warning > 0 → warning ; sinon ok. */
  status: 'ok' | 'warning' | 'critical'
}

export interface ReportRuleEntry {
  ruleId: string
  label: string
  severity: ReportSeverity
  pagesCount: number
  /** Échantillon d'URLs (cap REPORT_CAPS.SAMPLE_URLS), tri stable. */
  sampleUrls: string[]
  /** Nb de pages au-delà de l'échantillon (« + N autres »). */
  extraPagesCount: number
  /** Règle site-level (robots.txt, llms.txt…) : « site entier » plutôt que « 1 page ». */
  siteLevel: boolean
  knowledge: RuleKnowledge | null
}

export interface ReportRepairedEntry {
  ruleId: string
  label: string
  pagesCount: number
}

export interface ReportAnnexAlert {
  ruleId: string
  label: string
  severity: ReportSeverity
  message: string
  /** Preuve avant → après, tronquée à REPORT_CAPS.PROOF_CHARS. null si non applicable. */
  previous: string | null
  current: string | null
}

export interface ReportAnnexPage {
  url: string
  alerts: ReportAnnexAlert[]
  /** Alertes non détaillées au-delà du cap (« + N autres alertes »). */
  extraAlertsCount: number
}

export interface ZoneReport {
  meta: ZoneReportMeta
  verdict: ZoneReportVerdict
  /** Régressions (event/state) groupées par sévérité, triées par nb de pages décroissant. */
  regressions: Record<ReportSeverity, ReportRuleEntry[]>
  /** Régressions réparées dans le dernier crawl. */
  repaired: ReportRepairedEntry[]
  /** Recommandations : site-level d'abord, puis page-level par nb de pages décroissant. */
  recommendations: ReportRuleEntry[]
  /** Détail par page (pages les plus touchées d'abord, cap ANNEX_PAGES). */
  annex: ReportAnnexPage[]
  /** Pages avec alertes non détaillées en annexe (au-delà du cap). */
  annexExtraPagesCount: number
}

// ── Cockpit (page web uniquement) : delta du dernier crawl + frise des crawls.
// Ces données NE sont PAS dans ZoneReport → le .md et le PDF ne les voient pas.

/** Verdict d'ACTIVITÉ d'un crawl (sévérité max des régressions signalées ce crawl-là). */
export type CrawlActivityVerdict = 'critical' | 'warning' | 'info' | 'stable'

export interface CrawlTimelineEntry {
  crawlId: string
  completedAt: string | null
  status: string
  pagesScanned: number
  /** Régressions event/state signalées ce crawl (même définition que l'email : lastCrawlId == crawl). */
  regressions: number
  /** Régressions réparées ce crawl (resolvedCrawlId == crawl). */
  fixed: number
  verdict: CrawlActivityVerdict
}

/** Réponse de l'endpoint JSON de la page : nom de zone + historique des crawls (downloads par crawl). */
export interface ZoneCrawlHistory {
  zoneName: string
  timeline: CrawlTimelineEntry[]
}
