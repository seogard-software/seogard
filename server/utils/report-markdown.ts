import type { ReportRuleEntry, ZoneReport } from '../../shared/types/zone-report'
import type { Locale } from '../../shared/utils/i18n'
import { INTL_LOCALE } from '../../shared/utils/format'
import { t, tc } from './i18n'

// Rendu Markdown du rapport (pur) — destiné au téléchargement et à la lecture par IA.
// Frontmatter YAML = chiffres clés structurés (parsing machine sans toucher au récit) —
// ses CLÉS restent language-agnostic (inchangées quelle que soit la locale).
// Libellés : i18n/locales/<locale>/report.json via t()/tc(), locale portée par report.meta.locale.

const SEVERITY_ICON: Record<string, string> = { critical: '🔴', warning: '🟠', info: '⚪' }

function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return t(locale, 'report.date_never')
  return new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: 'numeric', month: 'long', year: 'numeric' })
}

function renderRuleEntry(entry: ReportRuleEntry, lines: string[], locale: Locale): void {
  const scope = entry.siteLevel ? t(locale, 'report.scope_site') : tc(locale, 'report.scope_pages', entry.pagesCount)
  lines.push(`### ${SEVERITY_ICON[entry.severity]} ${entry.label} — ${scope}`)
  lines.push('')
  if (entry.knowledge) {
    lines.push(`**${t(locale, 'report.md.knowledge_finding')}** ${entry.knowledge.constat}`)
    lines.push('')
    lines.push(`**${t(locale, 'report.md.knowledge_why')}** ${entry.knowledge.pourquoi}`)
    lines.push('')
    lines.push(`**${t(locale, 'report.md.knowledge_action')}** ${entry.knowledge.action}`)
    lines.push('')
    lines.push(`**${t(locale, 'report.md.knowledge_gain')}** ${entry.knowledge.gain}`)
    lines.push('')
  }
  if (!entry.siteLevel && entry.sampleUrls.length > 0) {
    lines.push(t(locale, 'report.md.affected_pages'))
    for (const url of entry.sampleUrls) lines.push(`- ${url}`)
    if (entry.extraPagesCount > 0) lines.push(`- ${t(locale, 'report.md.more_pages', { count: entry.extraPagesCount })}`)
    lines.push('')
  }
}

export function renderReportMarkdown(report: ZoneReport): string {
  const { meta, verdict } = report
  const locale = meta.locale
  const intl = INTL_LOCALE[locale]
  const lines: string[] = []

  // ── Frontmatter YAML (machine — clés language-agnostic, ne pas traduire) ──
  lines.push('---')
  lines.push(`site: ${meta.siteDomain}`)
  lines.push(`zone: "${meta.zoneName}"`)
  lines.push(`crawl: ${meta.crawlCompletedAt ?? 'null'}`)
  lines.push(`genere_le: ${meta.generatedAt}`)
  lines.push(`pages_crawlees: ${meta.pagesScanned}`)
  lines.push(`pages_total: ${meta.pagesTotal}`)
  lines.push(`statut: ${verdict.status}`)
  lines.push(`regressions_critiques: ${verdict.critical}`)
  lines.push(`regressions_warnings: ${verdict.warning}`)
  lines.push(`regressions_info: ${verdict.info}`)
  lines.push(`recommandations: ${verdict.recommendations}`)
  lines.push(`pages_contenu_machine_different: ${verdict.signaturePagesCount}`)
  lines.push('---')
  lines.push('')

  // ── Titre + verdict ──
  lines.push(`# ${t(locale, 'report.title')} — ${meta.siteDomain} · ${meta.zoneName}`)
  lines.push('')
  lines.push(`> ${t(locale, 'report.tagline')}`)
  lines.push('')
  lines.push(t(locale, 'report.crawl_line', {
    lastCrawl: formatDate(meta.crawlCompletedAt, locale),
    pages: meta.pagesScanned.toLocaleString(intl),
    generated: formatDate(meta.generatedAt, locale),
  }))
  lines.push('')
  lines.push(`## ${t(locale, 'report.md.verdict', { label: t(locale, `report.status.${verdict.status}`) })}`)
  lines.push('')
  lines.push(t(locale, 'report.md.table_header'))
  lines.push(`|---|---|---|---|`)
  lines.push(`| ${verdict.critical} | ${verdict.warning} | ${verdict.recommendations} | ${meta.pagesScanned.toLocaleString(intl)} |`)
  lines.push('')
  if (verdict.signaturePagesCount > 0) {
    lines.push(tc(locale, 'report.md.signature_mismatch', verdict.signaturePagesCount, { count: verdict.signaturePagesCount.toLocaleString(intl) }))
  }
  else {
    lines.push(t(locale, 'report.md.signature_ok'))
  }
  lines.push('')

  // ── Cycle de vie : pages retirées du monitoring (purge des 410 digérés — signal contextuel) ──
  if (meta.pagesPurged > 0) {
    lines.push(tc(locale, 'report.md.purged', meta.pagesPurged, { count: meta.pagesPurged.toLocaleString(intl) }))
    lines.push('')
  }

  // ── Régressions ──
  const totalRegressions = verdict.critical + verdict.warning + verdict.info
  lines.push(`## ${t(locale, 'report.md.regressions_title')}`)
  lines.push('')
  lines.push(t(locale, 'report.md.regressions_intro'))
  lines.push('')
  if (totalRegressions === 0) {
    lines.push(t(locale, 'report.md.regressions_empty'))
    lines.push('')
  }
  else {
    for (const severity of ['critical', 'warning', 'info'] as const) {
      for (const entry of report.regressions[severity]) renderRuleEntry(entry, lines, locale)
    }
  }

  // ── Réparées ──
  lines.push(`## ${t(locale, 'report.md.repaired_title')}`)
  lines.push('')
  if (report.repaired.length === 0) {
    lines.push(t(locale, 'report.md.repaired_empty'))
  }
  else {
    for (const item of report.repaired) {
      lines.push(`- ${tc(locale, 'report.md.repaired_line', item.pagesCount, { label: item.label })}`)
    }
  }
  lines.push('')

  // ── Recommandations ──
  lines.push(`## ${t(locale, 'report.md.recommendations_title')}`)
  lines.push('')
  lines.push(t(locale, 'report.md.recommendations_intro'))
  lines.push('')
  if (report.recommendations.length === 0) {
    lines.push(t(locale, 'report.md.recommendations_empty'))
    lines.push('')
  }
  else {
    for (const entry of report.recommendations) renderRuleEntry(entry, lines, locale)
  }

  // ── Annexe ──
  lines.push(`## ${t(locale, 'report.md.annex_title')}`)
  lines.push('')
  if (report.annex.length === 0) {
    lines.push(t(locale, 'report.md.annex_empty'))
    lines.push('')
  }
  else {
    for (const page of report.annex) {
      lines.push(`### ${page.url}`)
      lines.push('')
      for (const alert of page.alerts) {
        lines.push(`- ${SEVERITY_ICON[alert.severity]} **${alert.label}** — ${alert.message}`)
        if (alert.previous !== null || alert.current !== null) {
          lines.push(`  - ${t(locale, 'report.md.before')} \`${alert.previous ?? t(locale, 'report.md.empty_value')}\``)
          lines.push(`  - ${t(locale, 'report.md.after')} \`${alert.current ?? t(locale, 'report.md.empty_value')}\``)
        }
      }
      if (page.extraAlertsCount > 0) lines.push(`- ${t(locale, 'report.md.more_alerts', { count: page.extraAlertsCount })}`)
      lines.push('')
    }
    if (report.annexExtraPagesCount > 0) {
      lines.push(`> ${t(locale, 'report.md.annex_more_pages', { count: report.annexExtraPagesCount.toLocaleString(intl) })}`)
      lines.push('')
    }
  }

  lines.push('---')
  lines.push('')
  lines.push(t(locale, 'report.md.footer'))
  lines.push('')

  return lines.join('\n')
}
