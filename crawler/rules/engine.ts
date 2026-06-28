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

export function filterByPriority(results: RuleResult[], ctx: RuleContext): RuleResult[] {
  const types = new Set(results.map(r => r.type))

  // Status code error (≥ 400) → only the root cause matters
  if (types.has('status_code_changed') && ctx.newStatusCode >= 400) {
    return results.filter(r => r.type === 'status_code_changed')
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

  // Redirection 3xx SANS page_redirected (cas limite : 3xx sans header Location) → le corps est
  // vide, on ne garde que le changement de statut, jamais le contenu fantôme.
  if (ctx.newMeta.isRedirected) {
    return results.filter(r => r.type === 'status_code_changed')
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
