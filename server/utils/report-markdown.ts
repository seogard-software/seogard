import type { ReportRuleEntry, ZoneReport } from '../../shared/types/zone-report'

// Rendu Markdown du rapport (pur) — destiné au téléchargement et à la lecture par IA.
// Frontmatter YAML = chiffres clés structurés (parsing machine sans toucher au récit).

const SEVERITY_ICON: Record<string, string> = { critical: '🔴', warning: '🟠', info: '⚪' }
const STATUS_LABEL: Record<string, string> = { ok: 'OK', warning: 'À surveiller', critical: 'Action requise' }

function formatDate(iso: string | null): string {
  if (!iso) return 'jamais'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function renderRuleEntry(entry: ReportRuleEntry, lines: string[]): void {
  const scope = entry.siteLevel ? 'site entier' : `${entry.pagesCount} page${entry.pagesCount > 1 ? 's' : ''}`
  lines.push(`### ${SEVERITY_ICON[entry.severity]} ${entry.label} — ${scope}`)
  lines.push('')
  if (entry.knowledge) {
    lines.push(`**Constat.** ${entry.knowledge.constat}`)
    lines.push('')
    lines.push(`**Pourquoi c'est important.** ${entry.knowledge.pourquoi}`)
    lines.push('')
    lines.push(`**Action.** ${entry.knowledge.action}`)
    lines.push('')
    lines.push(`**Ce que vous gagnez.** ${entry.knowledge.gain}`)
    lines.push('')
  }
  if (!entry.siteLevel && entry.sampleUrls.length > 0) {
    lines.push('Pages concernées :')
    for (const url of entry.sampleUrls) lines.push(`- ${url}`)
    if (entry.extraPagesCount > 0) lines.push(`- … et ${entry.extraPagesCount} autres pages`)
    lines.push('')
  }
}

export function renderReportMarkdown(report: ZoneReport): string {
  const { meta, verdict } = report
  const lines: string[] = []

  // ── Frontmatter YAML (machine) ──
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
  lines.push(`# État de santé SEO — ${meta.siteDomain} · ${meta.zoneName}`)
  lines.push('')
  lines.push('> Comparaison HTML brut (indexé par Google) vs rendu JavaScript')
  lines.push('')
  lines.push(`Dernier crawl : ${formatDate(meta.crawlCompletedAt)} · ${meta.pagesScanned.toLocaleString('fr-FR')} pages crawlées · Généré le ${formatDate(meta.generatedAt)}`)
  lines.push('')
  lines.push(`## Verdict : ${STATUS_LABEL[verdict.status]}`)
  lines.push('')
  lines.push(`| Régressions critiques | Warnings | Recommandations | Pages crawlées |`)
  lines.push(`|---|---|---|---|`)
  lines.push(`| ${verdict.critical} | ${verdict.warning} | ${verdict.recommendations} | ${meta.pagesScanned.toLocaleString('fr-FR')} |`)
  lines.push('')
  if (verdict.signaturePagesCount > 0) {
    lines.push(`**⚠️ ${verdict.signaturePagesCount.toLocaleString('fr-FR')} page${verdict.signaturePagesCount > 1 ? 's' : ''} où Google et les IA voient un contenu différent de vos visiteurs** (écart entre le HTML brut et le rendu JavaScript).`)
  }
  else {
    lines.push(`**✅ Aucun écart détecté entre ce que voient vos visiteurs et ce que voient Google et les IA.**`)
  }
  lines.push('')

  // ── Régressions ──
  const totalRegressions = verdict.critical + verdict.warning + verdict.info
  lines.push('## 1. Régressions — ce qui fonctionnait et s’est dégradé')
  lines.push('')
  lines.push('*À corriger en priorité : chaque entrée est un changement détecté entre deux crawls (ou un état anormal), pas un conseil d’optimisation.*')
  lines.push('')
  if (totalRegressions === 0) {
    lines.push('✅ Aucune régression ouverte sur cette zone. Le monitoring continue à chaque crawl.')
    lines.push('')
  }
  else {
    for (const severity of ['critical', 'warning', 'info'] as const) {
      for (const entry of report.regressions[severity]) renderRuleEntry(entry, lines)
    }
  }

  // ── Réparées ──
  lines.push('## 2. Réparé depuis le dernier crawl')
  lines.push('')
  if (report.repaired.length === 0) {
    lines.push('Aucune régression réparée détectée lors du dernier crawl.')
  }
  else {
    for (const item of report.repaired) {
      lines.push(`- 🟢 ${item.label} — ${item.pagesCount} page${item.pagesCount > 1 ? 's' : ''}`)
    }
  }
  lines.push('')

  // ── Recommandations ──
  lines.push('## 3. Recommandations d’audit — ce qui n’a jamais été optimal')
  lines.push('')
  lines.push('*Bonnes pratiques détectées à chaque crawl. Jamais bloquant, jamais urgent — à distinguer des régressions de la section 1.*')
  lines.push('')
  if (report.recommendations.length === 0) {
    lines.push('Aucune recommandation ouverte.')
    lines.push('')
  }
  else {
    for (const entry of report.recommendations) renderRuleEntry(entry, lines)
  }

  // ── Annexe ──
  lines.push('## 4. Annexe — détail par page')
  lines.push('')
  if (report.annex.length === 0) {
    lines.push('Aucune page avec alerte ouverte.')
    lines.push('')
  }
  else {
    for (const page of report.annex) {
      lines.push(`### ${page.url}`)
      lines.push('')
      for (const alert of page.alerts) {
        lines.push(`- ${SEVERITY_ICON[alert.severity]} **${alert.label}** — ${alert.message}`)
        if (alert.previous !== null || alert.current !== null) {
          lines.push(`  - avant : \`${alert.previous ?? '(vide)'}\``)
          lines.push(`  - après : \`${alert.current ?? '(vide)'}\``)
        }
      }
      if (page.extraAlertsCount > 0) lines.push(`- … et ${page.extraAlertsCount} autres alertes sur cette page`)
      lines.push('')
    }
    if (report.annexExtraPagesCount > 0) {
      lines.push(`> ${report.annexExtraPagesCount.toLocaleString('fr-FR')} autres pages ont des alertes ouvertes — consultez le dashboard pour la liste complète.`)
      lines.push('')
    }
  }

  lines.push('---')
  lines.push('')
  lines.push(`*Rapport généré par [Seogard](https://seogard.io) — monitoring SEO/GEO continu. Comparaison HTML brut vs rendu JavaScript sur chaque page.*`)
  lines.push('')

  return lines.join('\n')
}
