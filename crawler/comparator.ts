import { createLogger } from './logger'
import type { PageMeta } from './fetcher'
import { runAllRules, type RuleContext, type RuleResult } from './rules/engine'
import { getRuleCategory } from '../shared/utils/constants'
// Import rules for side-effect registration
import './rules/meta'
import './rules/indexing'
import './rules/status-code'
import './rules/ssr-csr'
import './rules/heading'
import './rules/content'
import './rules/structured-data'
import './rules/technical'
import './rules/opengraph'
import './rules/i18n'
import './rules/redirect'
import './rules/recommendations'
import './rules/geo'

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
  siteContext?: RuleContext['siteContext']
}

export function compareSnapshots(input: CompareInput): AlertData[] {
  // Skip 429 — rate limiting from the target server, not a real site issue
  if (input.newStatusCode === 429) {
    log.debug({ pageUrl: input.pageUrl }, 'skipping comparison — 429 rate limited')
    return []
  }

  const ctx: RuleContext = {
    ...input,
    finalUrl: input.finalUrl ?? input.pageUrl,
    renderedMeta: input.renderedMeta ?? null,
    csrContentLength: input.csrContentLength ?? null,
    siteContext: input.siteContext,
  }

  const results = runAllRules(ctx)

  if (results.length > 0) {
    log.info({ pageUrl: input.pageUrl, alertCount: results.length }, 'alerts generated')
  }

  return results.map(r => ({ ...r, pageUrl: input.pageUrl, category: getRuleCategory(r.type) }))
}
