import type { PageMeta } from '../fetcher'
import type { PerfMetrics } from '../../shared/types/perf'

export interface RuleContext {
  pageUrl: string
  finalUrl: string
  // Old vs new (cross-crawl)
  oldMeta: PageMeta | null
  newMeta: PageMeta
  oldStatusCode: number | null
  newStatusCode: number
  // Signal d'INTENTION : la page est-elle encore déclarée dans le sitemap ? (dérivé de
  // MonitoredPage.outOfSitemapSince). Cassée/redirigée ENCORE au sitemap = pas voulu → alerte.
  // Sortie du sitemap en 3xx/410 = retrait assumé → silence. Défaut true (conservateur : on alerte).
  inSitemap?: boolean
  // Cible de redirection de la BASELINE (MonitoredPage.redirectTarget du crawl précédent).
  // oldMeta.redirectTarget ne convient PAS : la baseline meta est préservée de l'ère 200 (null).
  // Sert à redirect_broken pour figer « redirigeait vers X » dans l'alerte à la transition.
  oldRedirectTarget?: string | null
  // SSR vs CSR (within-crawl)
  renderedMeta: Partial<PageMeta> | null
  // URL finale après JavaScript (phase CSR uniquement) — null en phase SSR. Sert à détecter
  // les redirections JavaScript (window.location), invisibles au fetch HTTP.
  renderedUrl?: string | null
  ssrContentLength: number
  csrContentLength: number | null
  // Performance (mesuré pendant le render CSR, null en phase SSR)
  oldPerf?: PerfMetrics | null
  newPerf?: PerfMetrics | null
  // Site-level context (set once per crawl, shared across pages)
  siteContext?: {
    hasLlmsTxt: boolean
    oldHasLlmsTxt?: boolean
    aiCrawlersBlocked: string[]
    oldAiCrawlersBlocked?: string[]
    googlebotBlockedPaths?: string[]
    oldGooglebotBlockedPaths?: string[]
    robotsTxtRaw: string | null
    // URL racine enregistrée du site (normalisée) — ancre des règles site-level.
    siteRootUrl?: string
  }
}

export interface RuleResult {
  type: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  previousValue: string | null
  currentValue: string | null
}

export interface SEORule {
  id: string
  run: (ctx: RuleContext) => RuleResult[]
}

const rules: SEORule[] = []

export function registerRule(rule: SEORule) {
  rules.push(rule)
}

/** Ids des règles réellement enregistrées dans le moteur (pour le test de complétude). */
export function getRegisteredRuleIds(): string[] {
  return rules.map(r => r.id)
}

export function filterByPriority(results: RuleResult[], ctx: RuleContext): RuleResult[] {
  const types = new Set(results.map(r => r.type))

  // Status code error (≥ 400) → seuls les signaux racine comptent. Le corps d'une page d'erreur
  // est vide/générique : les *_missing/*_changed/recos qui en découlent sont du bruit. Hors
  // sitemap, status_code_changed est muet (retrait assumé) → on garde redirect_broken (la
  // redirection qui pourrit) et rec_unclean_removal (le conseil 404→410). Aucun signal → silence.
  if (ctx.newStatusCode >= 400) {
    const rootSignals = new Set(['status_code_changed', 'redirect_broken', 'rec_unclean_removal'])
    return results.filter(r => rootSignals.has(r.type))
  }

  // Redirect to homepage → everything else is noise
  if (types.has('redirect_to_homepage')) {
    return results.filter(r => r.type === 'redirect_to_homepage')
  }

  // Page redirects elsewhere → cause racine : une seule alerte. Supprime contenu/metas/recos issus
  // du corps vide de la redirection ET le doublon status_code_changed (200→3xx).
  if (types.has('page_redirected')) {
    return results.filter(r => r.type === 'page_redirected')
  }

  // Redirection JavaScript (CSR) → cause racine : le SSR et le rendu sont deux pages différentes,
  // donc les écarts SSR/CSR (ssr_content_mismatch…) sont du bruit. On ne garde que le signal JS.
  if (types.has('js_redirect_detected')) {
    return results.filter(r => r.type === 'js_redirect_detected')
  }

  // Redirection 3xx sans cause racine ci-dessus (hors sitemap = retrait assumé, ou 3xx sans
  // Location) → le corps est vide : jamais de contenu fantôme. On ne garde que le changement de
  // statut et le conseil « 302 → passe en 301 » (rec_redirect_temporary, hors sitemap uniquement).
  if (ctx.newMeta.isRedirected) {
    const keep = new Set(['status_code_changed', 'rec_redirect_temporary'])
    return results.filter(r => keep.has(r.type))
  }

  // Soft 404 → everything else is noise
  if (types.has('soft_404')) {
    return results.filter(r => r.type === 'soft_404')
  }

  return results
}

export function runAllRules(ctx: RuleContext): RuleResult[] {
  const results = rules.flatMap(r => r.run(ctx))
  return filterByPriority(results, ctx)
}

export function runRule(id: string, ctx: RuleContext): RuleResult[] {
  const rule = rules.find(r => r.id === id)
  if (!rule) throw new Error(`Rule not found: ${id}`)
  return rule.run(ctx)
}
