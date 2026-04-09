import { createLogger } from './logger'

const log = createLogger('fetcher')

const USER_AGENT = `Seogard-Bot/1.0 (+${process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'}/bot)`

export interface PageMeta {
  // Meta core
  title: string | null
  description: string | null
  canonical: string | null
  robots: string | null

  // Open Graph
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  ogUrl: string | null
  ogType: string | null

  // Twitter Cards
  twitterCard: string | null
  twitterTitle: string | null
  twitterImage: string | null

  // Technical
  viewport: string | null
  lang: string | null
  charset: string | null

  // i18n
  hreflangs: { lang: string; href: string }[]

  // Structured data
  jsonLdTypes: string[]
  jsonLdValid: boolean
  jsonLdAuthor: string | null
  jsonLdDatePublished: string | null
  jsonLdPublisher: string | null
  hasFaqSchema: boolean

  // Boolean detections
  hasMetaRefresh: boolean
  hasMixedContent: boolean
  isSoft404: boolean

  // Content
  wordCount: number

  // Headings (replaces h1, h1Count, headingLevels)
  headings: { level: number; text: string }[]

  // Links
  internalLinks: { href: string; anchor: string; rel: string | null }[]
  externalLinks: { href: string; anchor: string; rel: string | null }[]
  internalLinkCount: number
  externalLinkCount: number

  // Images (replaces imgWithoutAltCount)
  images: { src: string; alt: string | null; inLink: boolean }[]
  imgCount: number

  // Performance
  ttfbMs: number
  totalFetchMs: number
  htmlSize: number
  responseHeaders: {
    cacheControl: string | null
    contentType: string | null
    xRobotsTag: string | null
    server: string | null
  }

  // Redirects
  finalUrl: string
  isRedirected: boolean

  // Content structure (GEO)
  hasLists: boolean
  hasDefinitionLists: boolean

  // Semantic structure
  hasHeader: boolean
  hasNav: boolean
  hasMain: boolean
  hasFooter: boolean
  hasArticle: boolean

  // Favicon
  favicon: string | null
}

/**
 * Version allegee de PageMeta pour le stockage en DB (MonitoredPage.lastMeta, PageSnapshot.meta).
 * Exclut les tableaux volumineux (internalLinks, externalLinks, images) qui pesent ~20KB par page.
 * Garde headings car utilise par les rules de comparaison (heading.ts) et leger (~500 bytes).
 * Les rules de recommendation lisent le PageMeta complet du fetch courant (en RAM), pas de la DB.
 */
export type MetaCore = Omit<PageMeta, 'internalLinks' | 'externalLinks' | 'images' | 'ttfbMs' | 'totalFetchMs' | 'htmlSize' | 'responseHeaders'>

export function toMetaCore(meta: PageMeta): MetaCore {
  const { internalLinks, externalLinks, images, ttfbMs, totalFetchMs, htmlSize, responseHeaders, ...core } = meta
  return core
}

export interface FetchResult {
  url: string
  finalUrl: string
  statusCode: number
  html: string
  meta: PageMeta
  contentLength: number
}

// Retry strategy : si une page echoue (timeout, erreur reseau, 429/503),
// on reessaye jusqu'a MAX_RETRIES fois avec des delais croissants.
// Si la page ne repond toujours pas, elle est marquee "failed" et sera retentee au prochain crawl.
const MAX_RETRIES = 2
const RETRY_DELAYS = [1_000, 2_000] // delais entre chaque tentative (1s puis 2s)

export async function fetchPage(url: string, timeoutMs = 30_000): Promise<FetchResult> {
  const start = Date.now()

  let response: Response | null = null
  let lastError: Error | null = null
  let ttfbMs = 0

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const fetchStart = Date.now()
      response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      })
      ttfbMs = Date.now() - fetchStart

      // Succes ou erreur non-retryable → on sort de la boucle
      if (response.status !== 429 && response.status !== 503) break

      // 429 (rate limit) ou 503 (service unavailable) → on attend et on reessaye
      if (attempt < MAX_RETRIES) {
        const retryAfter = response.headers.get('retry-after')
        const delayMs = retryAfter ? Math.min(Number(retryAfter) * 1000, 30_000) : RETRY_DELAYS[attempt]
        log.warn({ url, attempt: attempt + 1, delayMs, status: response.status }, 'retryable status, retrying')
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
    catch (error) {
      // Timeout ou erreur reseau → on reessaye
      lastError = error as Error
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]))
      }
    }
  }

  if (!response) throw lastError ?? new Error(`Failed to fetch ${url}`)

  const html = await response.text()
  const totalFetchMs = Date.now() - start

  const responseHeaders = {
    cacheControl: response.headers.get('cache-control'),
    contentType: response.headers.get('content-type'),
    xRobotsTag: response.headers.get('x-robots-tag'),
    server: response.headers.get('server'),
  }

  const meta = extractMeta(html, url, response.url, response.status, ttfbMs, totalFetchMs, responseHeaders)

  log.debug({ url, statusCode: response.status, durationMs: totalFetchMs, contentLength: html.length }, 'page fetched')

  return {
    url,
    finalUrl: response.url,
    statusCode: response.status,
    html,
    meta,
    contentLength: html.length,
  }
}

// --- Site-level context (GEO) ---

const AI_CRAWLERS = ['GPTBot', 'ChatGPT-User', 'Anthropic-AI', 'ClaudeBot', 'CCBot', 'PerplexityBot', 'Bytespider']

export interface SiteContext {
  hasLlmsTxt: boolean
  aiCrawlersBlocked: string[]
  robotsTxtRaw: string | null
}

export async function fetchSiteContext(siteUrl: string): Promise<SiteContext> {
  const baseUrl = siteUrl.replace(/\/$/, '')
  let hasLlmsTxt = false
  let robotsTxtRaw: string | null = null
  const aiCrawlersBlocked: string[] = []

  // Check /llms.txt
  try {
    const response = await fetch(`${baseUrl}/llms.txt`, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': USER_AGENT },
    })
    hasLlmsTxt = response.ok && response.status === 200
  }
  catch {
    // ignore
  }

  // Parse robots.txt for AI crawler blocks
  try {
    const response = await fetch(`${baseUrl}/robots.txt`, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': USER_AGENT },
    })
    if (response.ok) {
      robotsTxtRaw = await response.text()
      for (const crawler of AI_CRAWLERS) {
        if (isDisallowedInRobotsTxt(robotsTxtRaw, crawler)) {
          aiCrawlersBlocked.push(crawler)
        }
      }
    }
  }
  catch {
    // ignore
  }

  return { hasLlmsTxt, aiCrawlersBlocked, robotsTxtRaw }
}

function isDisallowedInRobotsTxt(robotsTxt: string, userAgent: string): boolean {
  const lines = robotsTxt.split('\n').map(l => l.trim().toLowerCase())
  let inBlock = false

  for (const line of lines) {
    if (line.startsWith('user-agent:')) {
      const ua = line.slice('user-agent:'.length).trim()
      inBlock = ua === userAgent.toLowerCase() || ua === '*'
    }
    else if (line.startsWith('disallow:') && inBlock) {
      const path = line.slice('disallow:'.length).trim()
      if (path === '/' || path === '/*') return true
    }
    else if (line === '' && inBlock) {
      // Only reset if we were in a specific UA block (not *)
      if (inBlock) inBlock = false
    }
  }

  return false
}

// --- Core extraction ---

function extractMeta(
  html: string,
  requestUrl: string,
  finalUrl: string,
  statusCode: number,
  ttfbMs: number,
  totalFetchMs: number,
  responseHeaders: PageMeta['responseHeaders'],
): PageMeta {
  const jsonLd = extractJsonLd(html)
  const wc = countWords(html)
  const headings = extractAllHeadings(html)
  const { internalLinks, externalLinks } = extractLinks(html, finalUrl)
  const { images, imgCount } = extractAllImages(html)
  const semantic = extractSemanticStructure(html)

  return {
    title: extractTagContent(html, /<title[^>]*>([^<]*)<\/title>/i),
    description: extractMetaByName(html, 'description'),
    canonical: extractLinkHref(html, 'canonical'),
    robots: extractMetaByName(html, 'robots'),

    ogTitle: extractMetaByProperty(html, 'og:title'),
    ogDescription: extractMetaByProperty(html, 'og:description'),
    ogImage: extractMetaByProperty(html, 'og:image'),
    ogUrl: extractMetaByProperty(html, 'og:url'),
    ogType: extractMetaByProperty(html, 'og:type'),

    twitterCard: extractMetaByName(html, 'twitter:card'),
    twitterTitle: extractMetaByName(html, 'twitter:title'),
    twitterImage: extractMetaByName(html, 'twitter:image'),

    viewport: extractMetaByName(html, 'viewport'),
    lang: extractLang(html),
    charset: extractCharset(html),

    hreflangs: extractHreflangs(html),

    jsonLdTypes: jsonLd.types,
    jsonLdValid: jsonLd.valid,
    jsonLdAuthor: jsonLd.author,
    jsonLdDatePublished: jsonLd.datePublished,
    jsonLdPublisher: jsonLd.publisher,
    hasFaqSchema: jsonLd.hasFaqSchema,

    hasMetaRefresh: detectMetaRefresh(html),
    hasMixedContent: detectMixedContent(html, finalUrl),
    isSoft404: detectSoft404(html, statusCode, wc),

    wordCount: wc,

    headings,

    internalLinks,
    externalLinks,
    internalLinkCount: internalLinks.length,
    externalLinkCount: externalLinks.length,

    images,
    imgCount,

    ttfbMs,
    totalFetchMs,
    htmlSize: html.length,
    responseHeaders,

    finalUrl,
    isRedirected: requestUrl !== finalUrl,

    hasLists: /<[uo]l[\s>]/i.test(html),
    hasDefinitionLists: /<dl[\s>]/i.test(html),

    ...semantic,

    favicon: extractFavicon(html),
  }
}

// --- Tag helpers ---

function extractTagContent(html: string, regex: RegExp): string | null {
  const match = regex.exec(html)
  return match ? match[1].trim() : null
}

function extractMetaByName(html: string, name: string): string | null {
  const r1 = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i')
  const m1 = r1.exec(html)
  if (m1) return m1[1]

  const r2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, 'i')
  const m2 = r2.exec(html)
  return m2 ? m2[1] : null
}

function extractMetaByProperty(html: string, property: string): string | null {
  const escaped = property.replace(':', '\\:')

  const r1 = new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i')
  const m1 = r1.exec(html)
  if (m1) return m1[1]

  const r2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${escaped}["']`, 'i')
  const m2 = r2.exec(html)
  return m2 ? m2[1] : null
}

function extractLinkHref(html: string, rel: string): string | null {
  const r1 = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']*)["']`, 'i')
  const m1 = r1.exec(html)
  if (m1) return m1[1]

  const r2 = new RegExp(`<link[^>]+href=["']([^"']*)["'][^>]+rel=["']${rel}["']`, 'i')
  const m2 = r2.exec(html)
  return m2 ? m2[1] : null
}

// --- Headings ---

export function extractAllHeadings(html: string): { level: number; text: string }[] {
  const results: { level: number; text: string }[] = []
  const regex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const level = Number(match[1])
    const text = match[2].replace(/<[^>]+>/g, '').trim()
    if (text) results.push({ level, text })
  }
  return results
}

// --- Links ---

export function extractLinks(html: string, pageUrl: string): {
  internalLinks: { href: string; anchor: string; rel: string | null }[]
  externalLinks: { href: string; anchor: string; rel: string | null }[]
} {
  const internalLinks: { href: string; anchor: string; rel: string | null }[] = []
  const externalLinks: { href: string; anchor: string; rel: string | null }[] = []

  let pageHost: string
  try {
    pageHost = new URL(pageUrl).hostname
  }
  catch {
    return { internalLinks, externalLinks }
  }

  const regex = /<a\s[^>]*>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0]
    const hrefMatch = /href=["']([^"']*)["']/i.exec(tag)
    if (!hrefMatch) continue

    const rawHref = hrefMatch[1]
    // Skip anchors, javascript:, mailto:, tel:
    if (rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) continue

    const relMatch = /rel=["']([^"']*)["']/i.exec(tag)
    const rel = relMatch ? relMatch[1] : null

    // Extract anchor text (content between <a> and </a>)
    const anchorRegex = new RegExp(`${escapeRegex(tag)}([\\s\\S]*?)<\\/a>`, 'i')
    const anchorMatch = anchorRegex.exec(html.substring(match.index))
    const anchor = anchorMatch ? anchorMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    let resolved: URL
    try {
      resolved = new URL(rawHref, pageUrl)
    }
    catch {
      continue
    }

    const link = { href: resolved.href, anchor, rel }

    if (resolved.hostname === pageHost) {
      internalLinks.push(link)
    }
    else {
      externalLinks.push(link)
    }
  }

  return { internalLinks, externalLinks }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// --- Images ---

export function extractAllImages(html: string): { images: { src: string; alt: string | null; inLink: boolean }[]; imgCount: number } {
  const images: { src: string; alt: string | null; inLink: boolean }[] = []

  // Find all <a> tag ranges to determine if img is inside a link
  const linkRanges: { start: number; end: number }[] = []
  const linkRegex = /<a\s[^>]*>[\s\S]*?<\/a>/gi
  let lm
  while ((lm = linkRegex.exec(html)) !== null) {
    linkRanges.push({ start: lm.index, end: lm.index + lm[0].length })
  }

  const imgRegex = /<img\s[^>]*>/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    const tag = match[0]
    const srcMatch = /src=["']([^"']*)["']/i.exec(tag)
    if (!srcMatch) continue

    const altMatch = /alt=["']([^"']*)["']/i.exec(tag)
    const alt = altMatch ? altMatch[1] : null
    const inLink = linkRanges.some(r => match!.index >= r.start && match!.index < r.end)

    images.push({ src: srcMatch[1], alt, inLink })
  }

  return { images, imgCount: images.length }
}

// --- Semantic structure ---

export function extractSemanticStructure(html: string): {
  hasHeader: boolean
  hasNav: boolean
  hasMain: boolean
  hasFooter: boolean
  hasArticle: boolean
} {
  return {
    hasHeader: /<header[\s>]/i.test(html),
    hasNav: /<nav[\s>]/i.test(html),
    hasMain: /<main[\s>]/i.test(html),
    hasFooter: /<footer[\s>]/i.test(html),
    hasArticle: /<article[\s>]/i.test(html),
  }
}

// --- Performance ---

// --- Favicon ---

export function extractFavicon(html: string): string | null {
  // Try link[rel="icon"] first, then link[rel="shortcut icon"]
  const icon = extractLinkHref(html, 'icon')
  if (icon) return icon

  const shortcut = extractLinkHref(html, 'shortcut icon')
  return shortcut
}

// --- Existing extraction functions ---

function extractLang(html: string): string | null {
  const match = /<html[^>]+lang=["']([^"']*)["']/i.exec(html)
  return match ? match[1] : null
}

function extractCharset(html: string): string | null {
  const m1 = /<meta[^>]+charset=["']?([^\s"';>]+)/i.exec(html)
  return m1 ? m1[1] : null
}

function extractHreflangs(html: string): { lang: string; href: string }[] {
  const results: { lang: string; href: string }[] = []
  const regex = /<link\s[^>]*>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0]
    if (!/rel=["']alternate["']/i.test(tag)) continue
    const hreflangMatch = /hreflang=["']([^"']*)["']/i.exec(tag)
    const hrefMatch = /href=["']([^"']*)["']/i.exec(tag)
    if (hreflangMatch && hrefMatch) {
      results.push({ lang: hreflangMatch[1], href: hrefMatch[1] })
    }
  }
  return results
}

interface JsonLdResult {
  types: string[]
  valid: boolean
  author: string | null
  datePublished: string | null
  publisher: string | null
  hasFaqSchema: boolean
}

function extractJsonLd(html: string): JsonLdResult {
  const types: string[] = []
  let hasJsonLd = false
  let valid = true
  let author: string | null = null
  let datePublished: string | null = null
  let publisher: string | null = null
  let hasFaqSchema = false

  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    hasJsonLd = true
    try {
      const data = JSON.parse(match[1].trim())
      extractJsonLdFields(data)
      if (Array.isArray(data['@graph'])) {
        for (const item of data['@graph']) {
          extractJsonLdFields(item)
        }
      }
    }
    catch {
      valid = false
    }
  }
  if (!hasJsonLd) valid = true
  return { types, valid, author, datePublished, publisher, hasFaqSchema }

  function extractJsonLdFields(data: Record<string, unknown>) {
    if (data['@type']) {
      const type = String(data['@type'])
      types.push(type)
      if (type === 'FAQPage') hasFaqSchema = true
    }
    if (!author && data.author) {
      author = typeof data.author === 'string'
        ? data.author
        : (data.author as Record<string, unknown>)?.name
          ? String((data.author as Record<string, unknown>).name)
          : null
    }
    if (!datePublished && data.datePublished) {
      datePublished = String(data.datePublished)
    }
    if (!publisher && data.publisher) {
      publisher = typeof data.publisher === 'string'
        ? data.publisher
        : (data.publisher as Record<string, unknown>)?.name
          ? String((data.publisher as Record<string, unknown>).name)
          : null
    }
  }
}

function detectMetaRefresh(html: string): boolean {
  return /<meta[^>]+http-equiv=["']refresh["']/i.test(html)
}

function countWords(html: string): number {
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&\w+;/g, ' ')
  return text.split(/\s+/).filter(w => w.length > 0).length
}

function detectMixedContent(html: string, url: string): boolean {
  if (!url.startsWith('https://')) return false
  // Only flag loaded resources (img, script, iframe, etc.) and stylesheets — NOT <a href> links
  const hasMixedSrc = /<(?:img|script|iframe|embed|object|audio|video|source)\b[^>]*\bsrc=["']http:\/\/(?!localhost)/i.test(html)
  const hasMixedLink = /<link\b[^>]*\brel=["'](?:stylesheet|preload|icon|preconnect)["'][^>]*\bhref=["']http:\/\/(?!localhost)/i.test(html)
  const hasMixedForm = /<form\b[^>]*\baction=["']http:\/\/(?!localhost)/i.test(html)
  return hasMixedSrc || hasMixedLink || hasMixedForm
}

/**
 * Phrases that only appear on real "not found" pages — never in normal product/blog content.
 * Checked against the full body text, not just the title.
 */
const SOFT_404_BODY_PATTERNS = [
  'page not found',
  'page introuvable',
  'page inexistante',
  'cette page n\'existe plus',
  'this page doesn\'t exist',
  'this page does not exist',
  'no longer available',
  'seite nicht gefunden',
  'pagina no encontrada',
  'la page demandée n\'existe pas',
  'la page que vous recherchez',
  'the page you requested',
  'the page you\'re looking for',
  'page cannot be found',
  'nous n\'avons pas trouvé',
  'page supprimée',
]

/** Max word count — real pages have hundreds of words, soft 404 pages are nearly empty. */
const SOFT_404_MAX_WORDS = 100

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&\w+;/g, ' ')
    .toLowerCase()
}

export function detectSoft404(html: string, statusCode: number, wordCount: number): boolean {
  if (statusCode !== 200) return false
  if (wordCount >= SOFT_404_MAX_WORDS) return false

  const bodyText = stripHtmlToText(html)
  return SOFT_404_BODY_PATTERNS.some(p => bodyText.includes(p))
}
