// Métriques de performance d'une page, telles que mesurées au crawl.
// Toutes les valeurs sont scalaires (aucun tableau) → stockage léger, pas de bloat DB.
export interface PerfMetrics {
  ttfbMs: number              // temps de réponse serveur (mesuré sur chaque page)
  lcpMs: number | null        // Largest Contentful Paint : affichage du contenu principal
  cls: number | null          // Cumulative Layout Shift : stabilité visuelle (la page qui "saute")
  weightTotalKb: number | null
  weightHtmlKb: number | null
  weightCssKb: number | null
  weightJsKb: number | null
  weightImgKb: number | null
  weightFontKb: number | null
  weightOtherKb: number | null
  requestCount: number | null
}

export type WebVitalRating = 'good' | 'needs-improvement' | 'poor'

// ─── Seuils officiels Google ─────────────────────────────────────────────
// Source : https://web.dev/articles/vitals + https://web.dev/articles/ttfb
// NE PAS modifier sans source officielle. Une seule source de vérité dans tout le code.
export const PERF_THRESHOLDS = {
  // Largest Contentful Paint (ms)
  lcp: { good: 2500, poor: 4000 },
  // Cumulative Layout Shift (score sans unité)
  cls: { good: 0.1, poor: 0.25 },
  // Interaction to Next Paint (ms) — non mesuré en V1 (nécessite données terrain), seuil documenté
  inp: { good: 200, poor: 500 },
  // Time To First Byte (ms)
  ttfb: { good: 800, poor: 1800 },
  // Poids total de la page (KB). Pas un Core Web Vital, mais Lighthouse documente
  // ces ancres (audit "total-byte-weight" / "Avoid enormous network payloads") :
  // cible ≤ 1,6 MB, payload "énorme" au-delà de 5 MB.
  pageWeightKb: { good: 1600, poor: 5000 },
} as const

function rate(value: number, good: number, poor: number): WebVitalRating {
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

export function rateLcp(ms: number): WebVitalRating {
  return rate(ms, PERF_THRESHOLDS.lcp.good, PERF_THRESHOLDS.lcp.poor)
}

export function rateCls(cls: number): WebVitalRating {
  return rate(cls, PERF_THRESHOLDS.cls.good, PERF_THRESHOLDS.cls.poor)
}

export function rateTtfb(ms: number): WebVitalRating {
  return rate(ms, PERF_THRESHOLDS.ttfb.good, PERF_THRESHOLDS.ttfb.poor)
}

export function ratePageWeight(kb: number): WebVitalRating {
  return rate(kb, PERF_THRESHOLDS.pageWeightKb.good, PERF_THRESHOLDS.pageWeightKb.poor)
}
