import type { PageMeta } from '../fetcher'

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
  ssrContentLength: number
  csrContentLength: number | null
  // Site-level context (set once per crawl, shared across pages)
  siteContext?: {
    hasLlmsTxt: boolean
    oldHasLlmsTxt?: boolean
    aiCrawlersBlocked: string[]
    oldAiCrawlersBlocked?: string[]
    robotsTxtRaw: string | null
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
