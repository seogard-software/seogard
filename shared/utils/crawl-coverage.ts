// Couverture d'un crawl : combien de pages du sitemap ont RÉELLEMENT été analysées.
// `pagesScanned` compte les pages dépilées, succès ET échecs — il ne dit donc rien de ce qui a
// été analysé. Le seul compteur qui prouve l'analyse complète d'une page est `pagesRendered`.
//
// RÈGLE DE WORDING, non négociable : une cause n'est nommée que si elle est mesurée par UN
// compteur. Deux compteurs ne sont jamais additionnés sous un libellé commun, et le reliquat
// est affiché tel quel (`unexplained`) plutôt que rattaché de force à une cause plausible.

export type CoverageCauseKey = 'blocked' | 'notRetrieved' | 'renderFailed' | 'renderBlocked' | 'unexplained'
export type CoverageSeverity = 'critical' | 'warning' | 'info'

export interface CoverageCause {
  key: CoverageCauseKey
  count: number
}

export interface CrawlCoverageInput {
  /** URLs retenues du sitemap. */
  pagesTotal: number
  /** Rendus CSR réussis. `null` = compteur absent (clé Redis évincée) → non mesurable. */
  pagesRendered: number | null
  /** Renders Playwright en exception. `null` = compteur absent → non mesurable. */
  pagesCsrFailed: number | null
  /** Pages de challenge WAF reconnues par `isSsrBlocked()`. */
  pagesBlocked: number
  /** Requêtes HTTP en échec. On ne sait pas encore distinguer timeout / DNS / 5xx. */
  pagesFailed: number
  /** Rendus techniquement réussis mais servis par un challenge WAF (`isCsrBlocked`). */
  pagesCsrBlocked: number
  /** Redirections et pages supprimées : le rendu n'a pas lieu d'être, hors dénominateur. */
  pagesNotComparable: number
}

export interface CrawlCoverage {
  /** false → aucune alerte : donnée absente n'est pas donnée nulle. */
  measurable: boolean
  /** Dénominateur : sitemap moins les pages qui n'avaient pas à être rendues. */
  analysable: number
  analysed: number
  missing: number
  /** Arrondi PLANCHER : 99,6 % → 99. « 100 » n'apparaît que si tout a été analysé. */
  pct: number
  /** Uniquement les causes non nulles, jamais fusionnées entre elles. */
  causes: CoverageCause[]
  severity: CoverageSeverity | null
}

// Sévérité selon l'ampleur du trou (CLAUDE.md §7 « Sévérité — règle d'or »).
export const COVERAGE_CRITICAL_BELOW_PCT = 50
export const COVERAGE_WARNING_BELOW_PCT = 95
export const COVERAGE_INFO_BELOW_PCT = 100

function severityFor(pct: number): CoverageSeverity | null {
  if (pct < COVERAGE_CRITICAL_BELOW_PCT) return 'critical'
  if (pct < COVERAGE_WARNING_BELOW_PCT) return 'warning'
  if (pct < COVERAGE_INFO_BELOW_PCT) return 'info'
  return null
}

/**
 * Libellés techniques des causes (`Alert.message` / `currentValue` sont en anglais ; le wording
 * affiche vient des fichiers rules.json de i18n/locales).
 *
 * UN libellé = UN compteur. Deux causes ne sont jamais fusionnées sous un même mot : écrire
 * « 3 000 pages bloquées » quand ces 3 000 recouvrent trois situations différentes serait une
 * affirmation fausse. `notRetrieved` reste volontairement neutre — on sait que la requête a
 * échoué, pas si c'est un timeout, un DNS ou un 5xx.
 */
export const COVERAGE_CAUSE_LABEL: Record<CoverageCauseKey, string> = {
  blocked: 'blocked by firewall (HTTP fetch)',
  notRetrieved: 'not retrieved',
  renderFailed: 'JavaScript rendering failed',
  renderBlocked: 'blocked by firewall (JavaScript rendering)',
  unexplained: 'unexplained',
}

/** Ventilation lisible : « 3324 blocked by firewall · 2884 not retrieved ». Jamais d'addition. */
export function formatCoverageCauses(causes: CoverageCause[]): string {
  return causes.map(c => `${c.count} ${COVERAGE_CAUSE_LABEL[c.key]}`).join(' · ')
}

export function buildCrawlCoverage(input: CrawlCoverageInput): CrawlCoverage {
  const { pagesTotal, pagesRendered, pagesCsrFailed, pagesCsrBlocked, pagesBlocked, pagesFailed, pagesNotComparable } = input

  const measurable = pagesTotal > 0 && pagesRendered !== null && pagesCsrFailed !== null
  const analysable = Math.max(0, pagesTotal - pagesNotComparable)
  const analysed = Math.min(pagesRendered ?? 0, analysable)
  const missing = Math.max(0, analysable - analysed)

  if (!measurable || analysable === 0) {
    return { measurable: false, analysable, analysed, missing, pct: 0, causes: [], severity: null }
  }

  const pct = Math.floor((analysed / analysable) * 100)

  // Le reliquat : ce qui manque et qu'aucun compteur n'explique. On l'expose au lieu de le
  // répartir — c'est le seul garde-fou quand notre propre instrumentation est incomplète.
  const attributed = pagesBlocked + pagesFailed + (pagesCsrFailed ?? 0) + pagesCsrBlocked
  const unexplained = Math.max(0, missing - attributed)

  // Les compteurs sont affichés BRUTS, jamais plafonnés sur `missing` : un plafonnement
  // afficherait un nombre que rien n'a mesuré (« 200 bloquées » alors que le compteur en
  // dit 300). Si la somme dépasse le manque, l'incohérence doit se voir — c'est un bug de
  // comptage à corriger, pas à lisser.
  const causes: CoverageCause[] = [
    { key: 'blocked' as const, count: pagesBlocked },
    { key: 'notRetrieved' as const, count: pagesFailed },
    { key: 'renderFailed' as const, count: pagesCsrFailed ?? 0 },
    { key: 'renderBlocked' as const, count: pagesCsrBlocked },
    { key: 'unexplained' as const, count: unexplained },
  ].filter(cause => cause.count > 0)

  return { measurable: true, analysable, analysed, missing, pct, causes, severity: severityFor(pct) }
}
