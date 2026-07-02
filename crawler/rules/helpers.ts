import he from 'he'
import type { PageMeta } from '../fetcher'

export function truncate(str: string, max = 80): string {
  return str.length > max ? str.substring(0, max) + '...' : str
}

// Normalise une URL pour comparaison (trailing slash sur la racine :
// https://x.com → https://x.com/). Utilisé pour ancrer les règles site-level sur
// l'URL racine enregistrée du site, identiquement côté worker et côté règles.
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.pathname === '') parsed.pathname = '/'
    return parsed.toString()
  }
  catch { return url }
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

// Cibles de redirection typiques d'un WAF/anti-bot qui REDIRIGE le crawler vers un challenge
// (au lieu de le bloquer en 200/403). À traiter comme « bloqué », pas comme une vraie redirection.
const WAF_REDIRECT_PATTERNS = [
  '/cdn-cgi/', '/challenge', '/captcha', '/_incapsula', '/distil', '/sgcaptcha',
  '/akamai', '/datadome', 'cloudflareaccess.com', 'challenges.cloudflare.com',
  'captcha-delivery.com', 'perfdrive.com', 'geo.captcha',
]

export function isRedirectToWaf(redirectTarget: string | null | undefined): boolean {
  if (!redirectTarget) return false
  const lower = redirectTarget.toLowerCase()
  return WAF_REDIRECT_PATTERNS.some(p => lower.includes(p))
}

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

// ── Signal d'intention sitemap ──────────────────────────────────────────────
// Une page encore déclarée au sitemap qui casse/redirige = pas voulu → alerte.
// Sortie du sitemap en 3xx/410 = retrait assumé (« clean removal ») → silence.

/** Défaut conservateur : inSitemap absent → considérée au sitemap → on alerte. */
export function isInSitemap(ctx: { inSitemap?: boolean }): boolean {
  return ctx.inSitemap !== false
}

/** Retrait propre : hors sitemap ET (redirection 3xx OU 410 Gone). Le 404 nu n'est PAS propre. */
export function isCleanRemoval(ctx: { inSitemap?: boolean, newStatusCode: number }): boolean {
  if (isInSitemap(ctx)) return false
  const s = ctx.newStatusCode
  return (s >= 300 && s < 400) || s === 410
}
