import type { AlertData } from './comparator'
import { buildCrawlCoverage, formatCoverageCauses, type CrawlCoverage } from '../shared/utils/crawl-coverage'

/**
 * Règle `crawl_coverage_incomplete` — DÉCISION PURE, sans base ni Redis.
 *
 * Évaluée en fin de crawl et non dans le moteur par page : la couverture n'est connue qu'une
 * fois tous les compteurs figés. STATE, donc active dès le PREMIER crawl — une règle event
 * resterait muette faute de baseline, or c'est le premier rapport qui forge la confiance.
 *
 * L'appelant fait les lectures et les écritures ; ici on ne fait que décider. C'est ce qui
 * rend le comportement testable sans mocker Mongoose.
 */

export const COVERAGE_RULE_ID = 'crawl_coverage_incomplete'

export interface CoverageRuleInput {
  /** URL racine enregistrée du site : ancre des règles site-level (cf. incident 2026-06-03). */
  anchorUrl: string
  pagesTotal: number
  pagesBlocked: number
  pagesFailed: number
  /** `null` = clé Redis évincée → couverture non mesurable, aucune alerte. */
  pagesRendered: number | null
  pagesCsrFailed: number | null
  pagesCsrBlocked: number
  pagesNotComparable: number
}

export interface CoverageDecision {
  /** `null` = rien à signaler : couverture complète, ou compteurs absents. */
  alert: AlertData | null
  /** Vrai quand une alerte ouverte doit être fermée (couverture redevenue complète). */
  shouldResolve: boolean
  coverage: CrawlCoverage
}

export function decideCoverageAlert(input: CoverageRuleInput): CoverageDecision {
  const { anchorUrl, ...counters } = input
  const coverage = buildCrawlCoverage(counters)

  if (!coverage.severity) {
    return { alert: null, shouldResolve: true, coverage }
  }

  return {
    alert: {
      pageUrl: anchorUrl,
      type: COVERAGE_RULE_ID,
      category: 'state',
      severity: coverage.severity,
      message: `Only ${coverage.analysed} of ${coverage.analysable} pages were fully analysed (${coverage.pct}%)`,
      previousValue: null,
      currentValue: formatCoverageCauses(coverage.causes),
    },
    shouldResolve: false,
    coverage,
  }
}
