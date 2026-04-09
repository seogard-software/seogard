const DEFAULT_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const DEFAULT_TIMEOUT = 15_000

export const COMMON_SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemaps/sitemap.xml',
  '/sitemaps/sitemaps-index.xml',
  '/sitemap/sitemap.xml',
  '/sitemap.xml.gz',
  '/wp-sitemap.xml',
  '/sitemap-index.xml',
  '/post-sitemap.xml',
  '/page-sitemap.xml',
]

export interface FetchOptions {
  userAgent?: string
  timeout?: number
}

const NON_PAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.ico', '.bmp', '.tiff',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv',
  '.mp4', '.avi', '.mov', '.wmv', '.webm', '.mkv', '.flv',
  '.mp3', '.wav', '.ogg', '.flac', '.aac',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.xml', '.json', '.rss', '.atom',
])

/**
 * Normalize a page URL to avoid near-duplicates:
 * - Strip trailing slash (except root /)
 * - Strip fragment (#section)
 * - Decode percent-encoded chars (%C3%A9 → é)
 * - Lowercase the hostname
 */
export function normalizePageUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase()
    // Remove fragment
    parsed.hash = ''
    // Decode percent-encoded pathname
    let pathname = decodeURIComponent(parsed.pathname)
    // Strip trailing slash (keep root /)
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }
    return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`
  }
  catch {
    return url
  }
}

function isPageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const lastDot = pathname.lastIndexOf('.')
    if (lastDot === -1) return true
    const ext = pathname.slice(lastDot)
    return !NON_PAGE_EXTENSIONS.has(ext)
  }
  catch {
    return true
  }
}

export function extractUrls(xml: string, tag: 'url' | 'sitemap'): string[] {
  const urls: string[] = []
  const blockRegex = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'g')
  const locRegex = /<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/

  let match
  while ((match = blockRegex.exec(xml)) !== null) {
    const locMatch = locRegex.exec(match[0])
    if (locMatch?.[1]) {
      const raw = locMatch[1].trim()
      // For <sitemap> tags, keep all URLs as-is (they're sitemap references, not pages)
      if (tag === 'sitemap') {
        urls.push(raw)
      }
      // For <url> tags, normalize and filter out non-page URLs
      else if (isPageUrl(raw)) {
        urls.push(normalizePageUrl(raw))
      }
    }
  }

  return urls
}

export async function fetchTextWithStatus(url: string, opts?: FetchOptions): Promise<{ text: string | null, status: number | null }> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(opts?.timeout ?? DEFAULT_TIMEOUT),
      headers: {
        'User-Agent': opts?.userAgent ?? DEFAULT_USER_AGENT,
        'Accept': 'text/xml, application/xml, text/html, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    })
    if (!response.ok) return { text: null, status: response.status }
    return { text: await response.text(), status: response.status }
  }
  catch {
    return { text: null, status: null }
  }
}

export async function fetchText(url: string, opts?: FetchOptions): Promise<string | null> {
  const result = await fetchTextWithStatus(url, opts)
  return result.text
}

export async function findSitemapUrls(siteUrl: string, opts?: FetchOptions): Promise<string[]> {
  const urls: string[] = []

  const robotsTxt = await fetchText(new URL('/robots.txt', siteUrl).href, opts)
  if (robotsTxt) {
    for (const line of robotsTxt.split('\n')) {
      const match = /^Sitemap:\s*(.+)/i.exec(line.trim())
      if (match?.[1]) {
        urls.push(match[1].trim())
      }
    }
  }

  return urls
}

export function buildCandidateUrls(siteUrl: string, robotsSitemapUrls: string[]): string[] {
  const candidates: string[] = [...robotsSitemapUrls]
  const seen = new Set(candidates)

  for (const path of COMMON_SITEMAP_PATHS) {
    const url = new URL(path, siteUrl).href
    if (!seen.has(url)) {
      candidates.push(url)
      seen.add(url)
    }
  }

  return candidates
}

export interface SitemapResult {
  found: boolean
  urls: string[]
  sitemapUrl: string | null
  blocked?: boolean
}

export async function fetchSitemapHttp(
  sitemapUrl: string,
  opts?: FetchOptions,
): Promise<SitemapResult> {
  const { text: xml, status } = await fetchTextWithStatus(sitemapUrl, opts)

  if (status === 403) {
    return { found: false, urls: [], sitemapUrl: null, blocked: true }
  }

  if (!xml || !xml.includes('<loc>')) {
    return { found: false, urls: [], sitemapUrl: null }
  }

  return parseSitemapXml(xml, sitemapUrl, opts)
}

export async function parseSitemapXml(
  xml: string,
  sitemapUrl: string,
  opts?: FetchOptions,
): Promise<SitemapResult> {
  if (xml.includes('<sitemapindex')) {
    const childUrls = extractUrls(xml, 'sitemap')

    const urls: string[] = []
    // Fetch in parallel batches of 10
    for (let i = 0; i < childUrls.length; i += 10) {
      const batch = childUrls.slice(i, i + 10)
      const results = await Promise.allSettled(
        batch.map(childUrl => fetchText(childUrl, opts)),
      )
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          urls.push(...extractUrls(result.value, 'url'))
        }
      }
    }

    return { found: true, urls, sitemapUrl }
  }

  const urls = extractUrls(xml, 'url')
  return { found: urls.length > 0, urls, sitemapUrl }
}

export async function discoverSitemapHttp(siteUrl: string, opts?: FetchOptions): Promise<SitemapResult> {
  const robotsUrls = await findSitemapUrls(siteUrl, opts)
  const candidates = buildCandidateUrls(siteUrl, robotsUrls)
  const allUrls = new Set<string>()
  let sitemapUrl: string | null = null
  let sawBlocked = false

  for (const candidateUrl of candidates) {
    const result = await fetchSitemapHttp(candidateUrl, opts)
    if (result.blocked) {
      sawBlocked = true
      continue
    }
    if (result.found && result.urls.length > 0) {
      for (const u of result.urls) allUrls.add(u)
      if (!sitemapUrl) sitemapUrl = result.sitemapUrl
    }
  }

  if (allUrls.size === 0) {
    return { found: false, urls: [], sitemapUrl: null, blocked: sawBlocked }
  }

  return { found: true, urls: [...allUrls], sitemapUrl }
}
