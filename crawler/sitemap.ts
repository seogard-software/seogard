import { createLogger } from './logger'
import { chromium, type Browser } from 'playwright'
import {
  extractUrls,
  findSitemapUrls,
  buildCandidateUrls,
  fetchSitemapHttp,
  parseSitemapXml,
  filterUrlsByHost,
  type FetchOptions,
} from '../shared/utils/sitemap'

const log = createLogger('sitemap')

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const TIMEOUT_MS = 30_000
const PLAYWRIGHT_TIMEOUT_MS = 15_000

const fetchOpts: FetchOptions = { userAgent: USER_AGENT, timeout: TIMEOUT_MS }

// Re-use the browser from renderer module
let browser: Browser | null = null

export function setBrowser(b: Browser): void {
  browser = b
}

export interface DiscoverResult {
  urls: string[]
  sitemapBlocked: boolean
  foreignHostnames: string[]
  foreignUrlCount: number
}

export async function discoverPages(siteUrl: string): Promise<DiscoverResult> {
  const robotsUrls = await findSitemapUrls(siteUrl, fetchOpts)

  if (robotsUrls.length > 0) {
    log.info({ siteUrl, sitemapCount: robotsUrls.length }, 'sitemaps found in robots.txt')
  }

  const candidates = buildCandidateUrls(siteUrl, robotsUrls)
  const robotsSet = new Set(robotsUrls)
  let sawBlocked = false
  const allUrls = new Set<string>()

  for (const sitemapUrl of candidates) {
    // Only try Playwright fallback for URLs found in robots.txt
    // Common path guesses get HTTP only — avoids 30s × 10 timeout cascade
    const allowPlaywright = robotsSet.has(sitemapUrl)
    const result = await trySitemap(siteUrl, sitemapUrl, allowPlaywright)
    if (result.blocked) sawBlocked = true
    for (const url of result.urls) {
      allUrls.add(url)
    }
  }

  if (allUrls.size > 0) {
    const { kept, dropped } = filterUrlsByHost([...allUrls], siteUrl)
    const foreignHostnames = uniqueHostnames(dropped)

    if (dropped.length > 0) {
      log.warn({ siteUrl, droppedCount: dropped.length, foreignHostnames, sample: dropped.slice(0, 3) },
        'sitemap entries with foreign hostname skipped (likely misconfigured site: in Astro/Next/etc.)')
    }

    if (kept.length === 0) {
      log.error({ siteUrl, droppedCount: dropped.length, foreignHostnames, sample: dropped.slice(0, 3) },
        'sitemap is 100% cross-domain — falling back to homepage')
      return { urls: [siteUrl], sitemapBlocked: false, foreignHostnames, foreignUrlCount: dropped.length }
    }

    log.info({ siteUrl, pagesFound: kept.length, sitemapsScanned: candidates.length, dropped: dropped.length }, 'all sitemaps merged and deduplicated')
    return { urls: kept, sitemapBlocked: false, foreignHostnames, foreignUrlCount: dropped.length }
  }

  if (sawBlocked) {
    log.warn({ siteUrl }, 'sitemap blocked by WAF (403), falling back to homepage')
  }
  else {
    log.warn({ siteUrl }, 'no sitemap found after all attempts, falling back to homepage')
  }

  return { urls: [siteUrl], sitemapBlocked: sawBlocked, foreignHostnames: [], foreignUrlCount: 0 }
}

function uniqueHostnames(urls: string[]): string[] {
  const set = new Set<string>()
  for (const url of urls) {
    try { set.add(new URL(url).hostname.toLowerCase()) } catch {}
  }
  return [...set]
}

interface TrySitemapResult {
  urls: string[]
  blocked: boolean
}

async function trySitemap(siteUrl: string, sitemapUrl: string, allowPlaywright: boolean): Promise<TrySitemapResult> {
  // Try HTTP first (shared logic)
  const result = await fetchSitemapHttp(sitemapUrl, fetchOpts)
  if (result.found && result.urls.length > 0) {
    log.info({ siteUrl, sitemapUrl, pagesFound: result.urls.length }, 'sitemap fetched via HTTP')
    return { urls: result.urls, blocked: false }
  }

  if (result.blocked) {
    log.warn({ siteUrl, sitemapUrl }, 'sitemap blocked by WAF (403)')

    if (!allowPlaywright) return { urls: [], blocked: true }

    // Try Playwright as fallback — WAF might allow browser requests
    const browserResult = await trySitemapWithBrowser(siteUrl, sitemapUrl)
    return { urls: browserResult.urls, blocked: browserResult.urls.length === 0 }
  }

  if (!allowPlaywright) return { urls: [], blocked: false }

  // Fallback to Playwright (only for robots.txt URLs)
  const browserResult = await trySitemapWithBrowser(siteUrl, sitemapUrl)
  return { urls: browserResult.urls, blocked: false }
}

interface BrowserFetchResult {
  xml: string | null
  blocked: boolean
}

async function fetchXmlWithBrowser(url: string): Promise<BrowserFetchResult> {
  if (!browser) {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  }

  const page = await browser.newPage()
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PLAYWRIGHT_TIMEOUT_MS })
    if (!response) return { xml: null, blocked: false }
    if (response.status() === 403) return { xml: null, blocked: true }
    if (response.status() >= 400) return { xml: null, blocked: false }
    const xml = await page.content()
    return { xml: xml.includes('<loc>') ? xml : null, blocked: false }
  } catch {
    return { xml: null, blocked: false }
  } finally {
    await page.close()
  }
}

interface BrowserSitemapResult {
  urls: string[]
  blocked: boolean
}

async function trySitemapWithBrowser(siteUrl: string, sitemapUrl: string): Promise<BrowserSitemapResult> {
  const { xml, blocked } = await fetchXmlWithBrowser(sitemapUrl)
  if (!xml) return { urls: [], blocked }

  log.info({ siteUrl, sitemapUrl }, 'sitemap fetched via Playwright')

  // Sitemap index — fetch children via Playwright too (WAF may block HTTP)
  if (xml.includes('<sitemapindex')) {
    const childUrls = extractUrls(xml, 'sitemap')
    log.info({ siteUrl, childCount: childUrls.length }, 'sitemap index detected, fetching children via Playwright')

    const allUrls: string[] = []
    // Fetch children in parallel batches of 5
    for (let i = 0; i < childUrls.length; i += 5) {
      const batch = childUrls.slice(i, i + 5)
      const results = await Promise.allSettled(
        batch.map(async (childUrl) => {
          const { xml: childXml } = await fetchXmlWithBrowser(childUrl)
          return childXml ? extractUrls(childXml, 'url') : []
        }),
      )
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allUrls.push(...result.value)
        }
      }
    }

    log.info({ siteUrl, pagesFound: allUrls.length }, 'sitemap index children fetched via Playwright')
    return { urls: allUrls, blocked: false }
  }

  // Regular sitemap
  return { urls: extractUrls(xml, 'url'), blocked: false }
}
