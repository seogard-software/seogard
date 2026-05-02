import { chromium, type Browser, type Page } from 'playwright'
import { createLogger } from './logger'
import type { PageMeta } from './fetcher'

const log = createLogger('renderer')

let browser: Browser | null = null

export async function initBrowser(): Promise<void> {
  if (browser) return
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  log.info('browser initialized')
}

export function getBrowser(): Browser | null {
  return browser
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
    log.info('browser closed')
  }
}

export interface RenderResult {
  renderedMeta: Partial<PageMeta>
  csrContentLength: number
}

export async function renderPage(url: string, timeoutMs = 15_000): Promise<RenderResult> {
  if (!browser) await initBrowser()

  const start = Date.now()
  const page = await browser!.newPage()

  try {
    // Block heavy resources that slow down rendering and aren't needed for SEO
    await page.route(/\.(png|jpe?g|gif|webp|avif|svg|woff2?|ttf|eot)(\?.*)?$/i, route => route.abort())
    await page.route(reqUrl => {
      const hostname = reqUrl.hostname
      return hostname.includes('googletagmanager') ||
        hostname.includes('google-analytics') ||
        hostname.includes('doubleclick') ||
        hostname.includes('facebook') ||
        hostname.includes('hotjar') ||
        hostname.includes('segment') ||
        hostname.includes('hubspot')
    }, route => route.abort())

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    })

    // Attend que le JS finisse de s'executer (hydration React, Vue, etc.)
    // networkidle = pas de requete reseau pendant 500ms → le framework a fini de charger
    // Timeout 3s max : les pages rapides finissent en 100-500ms, les lentes ne bloquent pas
    await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => {})

    const html = await page.content()
    const renderedMeta = await extractRenderedMeta(page)
    const durationMs = Date.now() - start

    log.debug({ url, durationMs, csrContentLength: html.length }, 'page rendered')

    return {
      renderedMeta,
      csrContentLength: html.length,
    }
  } finally {
    await page.close()
  }
}

async function extractRenderedMeta(page: Page): Promise<Partial<PageMeta>> {
  // Use a string expression to avoid tsx/esbuild __name transform breaking page.evaluate
  return page.evaluate(`(() => {
    const getMeta = (n) => { const e = document.querySelector('meta[name="' + n + '"]'); return e ? e.content : null }
    const getProp = (p) => { const e = document.querySelector('meta[property="' + p + '"]'); return e ? e.content : null }
    const getLink = (r) => { const e = document.querySelector('link[rel="' + r + '"]'); return e ? e.href : null }

    // ─── Headings (rendered DOM, after JS hydration) ───
    const headings = []
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
      const level = parseInt(el.tagName.substring(1), 10)
      const text = (el.textContent || '').trim()
      headings.push({ level, text })
    })

    // ─── Links (internal vs external, rendered DOM) ───
    let internalLinkCount = 0
    let externalLinkCount = 0
    const pageHost = window.location.hostname
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || ''
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      try {
        const u = new URL(href, window.location.href)
        if (u.hostname === pageHost) internalLinkCount++
        else externalLinkCount++
      } catch (e) {}
    })

    // ─── Images (rendered DOM, with alt) ───
    const images = []
    document.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || ''
      const alt = img.getAttribute('alt')
      const inLink = !!img.closest('a')
      images.push({ src, alt: alt === null || alt === undefined ? null : alt, inLink })
    })
    const imgCount = images.length

    // ─── JSON-LD structured data (rendered DOM) ───
    const jsonLdTypes = []
    let jsonLdAuthor = null
    let jsonLdDatePublished = null
    let jsonLdPublisher = null
    let hasFaqSchema = false
    let jsonLdValid = true
    let hasJsonLd = false

    const extractFields = (data) => {
      if (!data || typeof data !== 'object') return
      if (data['@type']) {
        const type = String(data['@type'])
        jsonLdTypes.push(type)
        if (type === 'FAQPage') hasFaqSchema = true
      }
      if (!jsonLdAuthor && data.author) {
        jsonLdAuthor = typeof data.author === 'string' ? data.author : (data.author && data.author.name ? String(data.author.name) : null)
      }
      if (!jsonLdDatePublished && data.datePublished) jsonLdDatePublished = String(data.datePublished)
      if (!jsonLdPublisher && data.publisher) {
        jsonLdPublisher = typeof data.publisher === 'string' ? data.publisher : (data.publisher && data.publisher.name ? String(data.publisher.name) : null)
      }
    }

    document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      hasJsonLd = true
      try {
        const data = JSON.parse(s.textContent || '')
        extractFields(data)
        if (Array.isArray(data['@graph'])) data['@graph'].forEach(extractFields)
      } catch (e) { jsonLdValid = false }
    })
    if (!hasJsonLd) jsonLdValid = true

    // ─── Semantic structure (rendered DOM) ───
    const hasMain = !!document.querySelector('main')
    const hasHeader = !!document.querySelector('header')
    const hasFooter = !!document.querySelector('footer')
    const hasNav = !!document.querySelector('nav')
    const hasArticle = !!document.querySelector('article')

    // ─── Lists (rendered DOM) ───
    const hasLists = !!document.querySelector('ul, ol')
    const hasDefinitionLists = !!document.querySelector('dl')

    // ─── Word count (rendered DOM body text) ───
    const bodyText = (document.body && document.body.innerText) || ''
    const wordCount = bodyText.trim().split(/\\s+/).filter(Boolean).length

    return {
      title: document.title || null,
      description: getMeta('description'),
      canonical: getLink('canonical'),
      robots: getMeta('robots'),
      ogTitle: getProp('og:title'),
      ogDescription: getProp('og:description'),
      ogImage: getProp('og:image'),
      headings,
      internalLinkCount,
      externalLinkCount,
      images,
      imgCount,
      jsonLdTypes,
      jsonLdValid,
      jsonLdAuthor,
      jsonLdDatePublished,
      jsonLdPublisher,
      hasFaqSchema,
      hasMain,
      hasHeader,
      hasFooter,
      hasNav,
      hasArticle,
      hasLists,
      hasDefinitionLists,
      wordCount,
    }
  })()`)
}
