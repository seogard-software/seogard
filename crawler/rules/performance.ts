import { registerRule } from './engine'
import { ratePageWeight } from '../../shared/types/perf'

// ─── Helper de formatage (wording métier) ───────────────────────────────

function weight(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`
  return `${kb} KB`
}

// ═══════════════════════════════════════════════════════════════════════
//  POIDS DE PAGE — la SEULE régression perf fiable.
//
//  Les Web Vitals temporels (LCP, CLS, TTFB) ne sont volontairement PAS des
//  règles : mesurés en synthétique "one-shot", ils varient trop d'un crawl à
//  l'autre (même page sans changement) pour être un signal de régression
//  fiable. Ils restent affichés en MONITORING (graphe + médiane sur la carte),
//  sans alerte ni blocage. Le poids, lui, est déterministe (somme des
//  ressources) → une explosion est une vraie régression détectable.
// ═══════════════════════════════════════════════════════════════════════

// Régression (event) : poids total OU JS ≥ +50% ET delta > 200 KB.
registerRule({
  id: 'perf_page_weight_explosion',
  run(ctx) {
    const oldTotal = ctx.oldPerf?.weightTotalKb
    const newTotal = ctx.newPerf?.weightTotalKb
    const oldJs = ctx.oldPerf?.weightJsKb
    const newJs = ctx.newPerf?.weightJsKb
    if (oldTotal == null || newTotal == null || oldTotal <= 0) return []

    const totalExploded = newTotal >= oldTotal * 1.5 && newTotal - oldTotal > 200
    const jsExploded = oldJs != null && oldJs > 0 && newJs != null && newJs >= oldJs * 1.5 && newJs - oldJs > 200
    if (!totalExploded && !jsExploded) return []

    const pct = Math.round(((newTotal - oldTotal) / oldTotal) * 100)
    return [{
      type: 'perf_page_weight_explosion',
      severity: 'warning',
      message: `Page weight increased by ${pct}% (${weight(oldTotal)} → ${weight(newTotal)}). A heavy page loads slowly, especially on mobile and 4G.`,
      previousValue: weight(oldTotal),
      currentValue: weight(newTotal),
    }]
  },
})

// Audit absolu (recommendation) : page lourde (seuils Lighthouse, > 1,6 MB / > 5 MB).
registerRule({
  id: 'rec_perf_page_heavy',
  run(ctx) {
    const total = ctx.newPerf?.weightTotalKb
    if (total == null) return []
    const rating = ratePageWeight(total)
    if (rating === 'good') return []

    return [{
      type: 'rec_perf_page_heavy',
      severity: rating === 'poor' ? 'warning' : 'info',
      message: `This page weighs ${weight(total)} (recommended: under 1.6 MB). Compressing images and trimming JavaScript would speed up loading.`,
      previousValue: null,
      currentValue: weight(total),
    }]
  },
})
