import { createLogger } from './logger'
import type { PageMeta } from './fetcher'
import type { PerfMetrics } from '../shared/types/perf'
import { ratePageWeight } from '../shared/types/perf'
import { runAllRules, type RuleContext, type RuleResult } from './rules/engine'
import { getRuleCategory } from '../shared/utils/constants'
import { getH1, getH1Count, getHeadingLevels, hasHierarchySkip } from './rules/heading'
// Import rules for side-effect registration
import './rules/meta'
import './rules/indexing'
import './rules/status-code'
import './rules/ssr-csr'
import './rules/content'
import './rules/structured-data'
import './rules/technical'
import './rules/opengraph'
import './rules/i18n'
import './rules/redirect'
import './rules/recommendations'
import './rules/geo'
import './rules/performance'

const log = createLogger('comparator')

export type AlertData = RuleResult & { pageUrl: string, category: 'state' | 'event' | 'recommendation' }

export interface CompareInput {
  pageUrl: string
  finalUrl?: string
  oldMeta: PageMeta | null
  newMeta: PageMeta
  oldStatusCode: number | null
  newStatusCode: number
  renderedMeta?: Partial<PageMeta> | null
  ssrContentLength: number
  csrContentLength?: number | null
  oldPerf?: PerfMetrics | null
  newPerf?: PerfMetrics | null
  siteContext?: RuleContext['siteContext']
}

export interface CompareResult {
  alerts: AlertData[]
  // Règles de régression dont le défaut est RÉPARÉ sur ce crawl → leurs alertes
  // ouvertes peuvent être auto-résolues (liste blanche RESOLVE_WHEN ci-dessous).
  clearedRuleIds: string[]
}

// Prédicats de récupération « la page est-elle SAINE maintenant ? » par règle event.
// Liste blanche STRICTE de 18 règles.
// Détection (run()) inchangée : ceci ne sert QU'À résoudre, jamais à créer. Donnée
// absente → false → alerte conservée (résolution conservatrice, zéro fermeture à tort).
//
// VOLONTAIREMENT ABSENTES (résolution MANUELLE — validation humaine) :
//  - tous les *_changed (title/description/canonical/h1/hreflang/lang/robots/ai_crawlers/word_count)
//  - canonical_missing, status_code_changed, noindex_added (critiques)
//  - content_removed : règle RELATIVE — le « réparé » exigerait le nb de mots d'avant
//    la chute (uniquement dans previousValue, une chaîne d'affichage). On refuse de
//    parser une chaîne d'affichage pour décider de fermer une alerte → manuel.
export const RESOLVE_WHEN: Record<string, (ctx: RuleContext) => boolean> = {
  // Éléments « disparus » → sains si revenus
  meta_title_missing: ctx => !!ctx.newMeta.title,
  meta_description_missing: ctx => !!ctx.newMeta.description,
  h1_missing: ctx => getH1Count(ctx.newMeta) >= 1,
  charset_missing: ctx => !!ctx.newMeta.charset,
  viewport_missing: ctx => !!ctx.newMeta.viewport,
  lang_attribute_missing: ctx => !!ctx.newMeta.lang,
  og_image_removed: ctx => !!ctx.newMeta.ogImage,
  og_title_removed: ctx => !!ctx.newMeta.ogTitle,
  structured_data_removed: ctx => (ctx.newMeta.jsonLdTypes?.length ?? 0) > 0,
  structured_data_author_removed: ctx => !!ctx.newMeta.jsonLdAuthor,
  faq_schema_removed: ctx => ctx.newMeta.hasFaqSchema === true,
  hreflang_removed: ctx => (ctx.newMeta.hreflangs?.length ?? 0) > 0,
  llms_txt_removed: ctx => ctx.siteContext?.hasLlmsTxt === true,
  // Défauts de qualité → sains si corrigés
  h1_multiple: ctx => getH1Count(ctx.newMeta) <= 1,
  heading_hierarchy_broken: ctx => !hasHierarchySkip(getHeadingLevels(ctx.newMeta)),
  thin_content: ctx => (ctx.newMeta.wordCount ?? 0) >= 200,
  // Régression perf (poids déterministe) → saine si le poids est de nouveau « bon ».
  // LCP/CLS/TTFB ne sont PAS ici : monitoring pur, sans alerte donc rien à auto-résoudre.
  perf_page_weight_explosion: ctx => ctx.newPerf?.weightTotalKb != null && ratePageWeight(ctx.newPerf.weightTotalKb) === 'good',
}

// Règles event saines sur ce crawl → leurs alertes ouvertes seront auto-résolues.
export function clearedRuleIds(ctx: RuleContext): string[] {
  return Object.keys(RESOLVE_WHEN).filter(id => RESOLVE_WHEN[id]!(ctx))
}

export function compareSnapshots(input: CompareInput): CompareResult {
  // Skip 429 — rate limiting from the target server, not a real site issue
  if (input.newStatusCode === 429) {
    log.debug({ pageUrl: input.pageUrl }, 'skipping comparison — 429 rate limited')
    return { alerts: [], clearedRuleIds: [] }
  }

  const ctx: RuleContext = {
    ...input,
    finalUrl: input.finalUrl ?? input.pageUrl,
    renderedMeta: input.renderedMeta ?? null,
    csrContentLength: input.csrContentLength ?? null,
    oldPerf: input.oldPerf ?? null,
    newPerf: input.newPerf ?? null,
    siteContext: input.siteContext,
  }

  const results = runAllRules(ctx)

  if (results.length > 0) {
    log.info({ pageUrl: input.pageUrl, alertCount: results.length }, 'alerts generated')
  }

  return {
    alerts: results.map(r => ({ ...r, pageUrl: input.pageUrl, category: getRuleCategory(r.type) })),
    clearedRuleIds: clearedRuleIds(ctx),
  }
}
