import he from 'he'
import type { PageMeta } from '../fetcher'

export function truncate(str: string, max = 80): string {
  return str.length > max ? str.substring(0, max) + '...' : str
}

export function decodeEntities(str: string): string {
  return he.decode(str)
}

export function normalizeForCompare(str: string): string {
  // Double-decode handles double-encoded entities (&amp;nbsp; → &nbsp; → \u00A0)
  return he.decode(he.decode(str)).replace(/[\s\u00A0]+/g, ' ').trim()
}

const WAF_BLOCKED_TITLES = [
  'access denied', 'attention required', 'just a moment', 'blocked', 'forbidden',
  'captcha', 'security check', 'please wait', 'checking your browser',
  'un instant', 'vérification', 'pardon our interruption',
  'you have been blocked', 'bot protection', 'ddos protection',
  'challenge validation', 'human verification', 'are you a robot', 'robot check',
]

export function isSsrBlocked(statusCode: number, ssrContentLength: number, meta: PageMeta): boolean {
  // 403 Forbidden → WAF block
  if (statusCode === 403) return true

  // Title matches a WAF challenge page pattern
  if (meta.title) {
    const lower = meta.title.toLowerCase()
    if (WAF_BLOCKED_TITLES.some(t => lower.includes(t))) return true
  }

  // Very small response with no SEO content → challenge/block page
  const h1 = meta.headings?.find(h => h.level === 1)?.text ?? null
  if (ssrContentLength > 0 && ssrContentLength < 1500 && !meta.title && !meta.description && !h1) {
    return true
  }

  return false
}

export function isCsrBlocked(renderedMeta: Partial<PageMeta> | null | undefined, csrContentLength: number | null | undefined): boolean {
  if (csrContentLength && csrContentLength < 2000) return true

  if (renderedMeta?.title) {
    const lower = renderedMeta.title.toLowerCase()
    return WAF_BLOCKED_TITLES.some(t => lower.includes(t))
  }

  return false
}
