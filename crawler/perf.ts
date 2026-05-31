import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Page } from 'playwright'
import type { PerfMetrics } from '../shared/types/perf'

// On injecte la lib officielle web-vitals (build IIFE) telle quelle, puis un petit
// collecteur qui stocke les dernières valeurs LCP/CLS dans window.__seogardPerf.
// reportAllChanges:true → on récupère la valeur courante sans attendre l'unload.
const require = createRequire(import.meta.url)
const WEB_VITALS_IIFE = readFileSync(
  join(dirname(require.resolve('web-vitals')), 'web-vitals.iife.js'),
  'utf-8',
)

export const WEB_VITALS_INIT_SCRIPT = `
${WEB_VITALS_IIFE}
window.__seogardPerf = { lcp: null, cls: null };
webVitals.onLCP(function (m) { window.__seogardPerf.lcp = m.value; }, { reportAllChanges: true });
webVitals.onCLS(function (m) { window.__seogardPerf.cls = m.value; }, { reportAllChanges: true });
`

export type ResourceType = 'css' | 'js' | 'img' | 'font' | 'other'

interface RawResource {
  name: string
  initiatorType: string
  transferSize: number
  encodedBodySize: number
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp)(\?|$)/i
const FONT_EXT = /\.(woff2?|ttf|eot|otf)(\?|$)/i
const CSS_EXT = /\.css(\?|$)/i
const JS_EXT = /\.(m?js|cjs)(\?|$)/i

export function classifyResourceType(name: string, initiatorType: string): ResourceType {
  if (initiatorType === 'css' || CSS_EXT.test(name)) return 'css'
  if (initiatorType === 'script' || JS_EXT.test(name)) return 'js'
  if (initiatorType === 'img' || IMAGE_EXT.test(name)) return 'img'
  if (FONT_EXT.test(name)) return 'font'
  return 'other'
}

export interface ResourceWeights {
  weightTotalKb: number
  weightHtmlKb: number
  weightCssKb: number
  weightJsKb: number
  weightImgKb: number
  weightFontKb: number
  weightOtherKb: number
  requestCount: number
}

// Agrégation pure du poids par type — testable sans navigateur.
// transferSize = octets réellement téléchargés ; fallback encodedBodySize si 0
// (cross-origin sans en-tête Timing-Allow-Origin peut renvoyer 0).
export function aggregateWeights(resources: RawResource[], navTransferSize: number): ResourceWeights {
  const bytes = { css: 0, js: 0, img: 0, font: 0, other: 0 }

  for (const r of resources) {
    const size = r.transferSize > 0 ? r.transferSize : r.encodedBodySize
    bytes[classifyResourceType(r.name, r.initiatorType)] += size
  }

  const htmlBytes = navTransferSize
  const toKb = (b: number) => Math.round(b / 1024)
  const totalBytes = htmlBytes + bytes.css + bytes.js + bytes.img + bytes.font + bytes.other

  return {
    weightTotalKb: toKb(totalBytes),
    weightHtmlKb: toKb(htmlBytes),
    weightCssKb: toKb(bytes.css),
    weightJsKb: toKb(bytes.js),
    weightImgKb: toKb(bytes.img),
    weightFontKb: toKb(bytes.font),
    weightOtherKb: toKb(bytes.other),
    requestCount: resources.length + 1, // +1 pour le document HTML
  }
}

// Lit les métriques de perf depuis la page rendue (après settle).
// Le TTFB vient du fetch HTTP amont (déjà mesuré), passé en argument.
export async function extractPerf(page: Page, ttfbMs: number): Promise<PerfMetrics> {
  const raw = await page.evaluate(() => {
    const vitals = (window as unknown as { __seogardPerf?: { lcp: number | null, cls: number | null } }).__seogardPerf
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceResourceTiming | undefined
    const resources = performance.getEntriesByType('resource').map((e) => {
      const r = e as PerformanceResourceTiming
      return { name: r.name, initiatorType: r.initiatorType, transferSize: r.transferSize, encodedBodySize: r.encodedBodySize }
    })
    return { lcp: vitals?.lcp ?? null, cls: vitals?.cls ?? null, navTransferSize: nav?.transferSize ?? 0, resources }
  })

  const weights = aggregateWeights(raw.resources, raw.navTransferSize)

  return {
    ttfbMs,
    lcpMs: raw.lcp !== null ? Math.round(raw.lcp) : null,
    cls: raw.cls !== null ? Math.round(raw.cls * 1000) / 1000 : null,
    ...weights,
  }
}
