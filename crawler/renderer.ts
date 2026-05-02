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

    // Extract all headings from the rendered DOM (after JS hydration)
    const headings = []
    const headingNodes = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headingNodes.forEach((el) => {
      const level = parseInt(el.tagName.substring(1), 10)
      const text = (el.textContent || '').trim()
      headings.push({ level, text })
    })

    return {
      title: document.title || null,
      description: getMeta('description'),
      canonical: getLink('canonical'),
      robots: getMeta('robots'),
      ogTitle: getProp('og:title'),
      ogDescription: getProp('og:description'),
      ogImage: getProp('og:image'),
      headings,
    }
  })()`)
}
