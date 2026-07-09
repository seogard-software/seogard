import { createLogger } from './logger'
import type { PageMeta } from './fetcher'
import type { PerfMetrics } from '../shared/types/perf'
import { ratePageWeight } from '../shared/types/perf'
import { runAllRules, type RuleContext, type RuleResult } from './rules/engine'
import { getRuleCategory } from '../shared/utils/constants'
import { getH1, getH1Count, getHeadingLevels, hasHierarchySkip } from './rules/heading'
import { isCleanRemoval, isInSitemap } from './rules/helpers'
// content.ts est chargé (et ses règles enregistrées : soft_404/thin_content/content_removed) par
// cet import nommé — il tient lieu du `import './rules/content'` de side-effect des autres règles.
// Ne pas retirer. Filet : test/crawler/registry-completeness.test.ts casse si une règle manque.
import { THIN_CONTENT_MIN_WORDS } from './rules/content'
// Import rules for side-effect registration
import './rules/meta'
import './rules/indexing'
import './rules/status-code'
import './rules/ssr-csr'
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
  // Signal d'intention sitemap (cf. RuleContext.inSitemap). Absent → true (conservateur : on alerte).
  inSitemap?: boolean
  // Cible de redirection de la baseline (cf. RuleContext.oldRedirectTarget).
  oldRedirectTarget?: string | null
  renderedMeta?: Partial<PageMeta> | null
  renderedUrl?: string | null
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
// Liste blanche STRICTE de 20 règles.
// Détection (run()) inchangée : ceci ne sert QU'À résoudre, jamais à créer. Donnée
// absente → false → alerte conservée (résolution conservatrice, zéro fermeture à tort).
//
// VOLONTAIREMENT ABSENTES (résolution MANUELLE — validation humaine) :
//  - tous les *_changed de CONTENU (title/description/canonical/h1/hreflang/lang/robots/ai_crawlers/word_count)
//  - canonical_missing, noindex_added (critiques)
//  - content_removed : règle RELATIVE — le « réparé » exigerait le nb de mots d'avant
//    la chute (uniquement dans previousValue, une chaîne d'affichage). On refuse de
//    parser une chaîne d'affichage pour décider de fermer une alerte → manuel.
//
// DOCTRINE (ajustée 2026-07) : status_code_changed / page_redirected / redirect_broken SONT
// auto-résolus — un statut HTTP est objectif (200 = réparé, sortie propre du sitemap = assumé),
// et une 503 réparée qui reste ouverte pollue la vue de ce qui est cassé MAINTENANT. La trace
// de l'incident reste dans l'historique + les rapports figés (R2).
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
  thin_content: ctx => (ctx.newMeta.wordCount ?? 0) >= THIN_CONTENT_MIN_WORDS,
  // Régression perf (poids déterministe) → saine si le poids est de nouveau « bon ».
  // LCP/CLS/TTFB ne sont PAS ici : monitoring pur, sans alerte donc rien à auto-résoudre.
  perf_page_weight_explosion: ctx => ctx.newPerf?.weightTotalKb != null && ratePageWeight(ctx.newPerf.weightTotalKb) === 'good',
  // Statuts HTTP (objectifs) → sains si retour 200 OU retrait propre (hors sitemap + 3xx/410).
  // Ces prédicats ne dépendent QUE du statut/sitemap → sûrs même sur un corps vide (redirection).
  status_code_changed: ctx => ctx.newStatusCode === 200 || isCleanRemoval(ctx),
  page_redirected: ctx => (!ctx.newMeta.isRedirected && ctx.newStatusCode === 200) || !isInSitemap(ctx),
  redirect_broken: ctx => ctx.newMeta.isRedirected || ctx.newStatusCode === 200 || isCleanRemoval(ctx),
}

// Prédicats évaluables sur une page qui REDIRIGE (corps vide) : uniquement ceux basés sur le
// statut/sitemap. Les prédicats de contenu (h1_multiple ≤ 1 sur un corps vide…) fermeraient à tort.
export const REDIRECT_SAFE_RESOLVE = new Set(['status_code_changed', 'page_redirected', 'redirect_broken'])

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
    renderedUrl: input.renderedUrl ?? null,
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
