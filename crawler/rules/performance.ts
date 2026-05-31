import { registerRule } from './engine'
import { PERF_THRESHOLDS, ratePageWeight, rateCls, rateLcp } from '../../shared/types/perf'

// ─── Helpers de formatage (wording métier) ──────────────────────────────

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} s`
}

function weight(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`
  return `${kb} KB`
}

// Rang de sévérité d'une note : good(0) < needs-improvement(1) < poor(2)
const RATING_RANK = { good: 0, 'needs-improvement': 1, poor: 2 } as const

// ═══════════════════════════════════════════════════════════════════════
//  A. RÉGRESSIONS (event) — comparées au crawl précédent, ne fire pas au 1er
// ═══════════════════════════════════════════════════════════════════════

// Serveur plus lent qu'avant : ≥ 2× ET > 600ms (évite le bruit des micro-variations).
registerRule({
  id: 'perf_ttfb_increase',
  run(ctx) {
    const oldTtfb = ctx.oldPerf?.ttfbMs
    const newTtfb = ctx.newPerf?.ttfbMs
    if (oldTtfb == null || newTtfb == null || oldTtfb <= 0) return []
    if (newTtfb < 600 || newTtfb < oldTtfb * 2) return []

    return [{
      type: 'perf_ttfb_increase',
      severity: 'warning',
      message: `Votre serveur répond plus lentement qu'avant : ${oldTtfb} ms → ${newTtfb} ms. Un serveur lent ralentit le chargement de toute la page.`,
      previousValue: `${oldTtfb} ms`,
      currentValue: `${newTtfb} ms`,
    }]
  },
})

// Affichage du contenu principal dégradé : franchit un palier Google vers le pire ET +30%.
registerRule({
  id: 'perf_lcp_degradation',
  run(ctx) {
    const oldLcp = ctx.oldPerf?.lcpMs
    const newLcp = ctx.newPerf?.lcpMs
    if (oldLcp == null || newLcp == null) return []

    const worsened = RATING_RANK[rateLcp(newLcp)] > RATING_RANK[rateLcp(oldLcp)]
    if (!worsened || newLcp < oldLcp * 1.3) return []

    return [{
      type: 'perf_lcp_degradation',
      severity: 'warning',
      message: `L'affichage de votre page principale a ralenti : ${seconds(oldLcp)} → ${seconds(newLcp)}. Au-delà de 2,5 s, Google considère la page comme lente et peut la faire reculer dans les résultats.`,
      previousValue: seconds(oldLcp),
      currentValue: seconds(newLcp),
    }]
  },
})

// Stabilité visuelle dégradée : franchit un palier Google vers le pire.
registerRule({
  id: 'perf_cls_degradation',
  run(ctx) {
    const oldCls = ctx.oldPerf?.cls
    const newCls = ctx.newPerf?.cls
    if (oldCls == null || newCls == null) return []
    if (RATING_RANK[rateCls(newCls)] <= RATING_RANK[rateCls(oldCls)]) return []

    return [{
      type: 'perf_cls_degradation',
      severity: 'warning',
      message: `Votre page bouge davantage pendant le chargement : le contenu saute plus qu'avant. Mauvais pour l'expérience visiteur et pénalisé par Google.`,
      previousValue: String(oldCls),
      currentValue: String(newCls),
    }]
  },
})

// Page beaucoup plus lourde : poids total OU JS ≥ +50% ET delta > 200 KB.
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
      message: `Le poids de votre page a augmenté de ${pct}% (${weight(oldTotal)} → ${weight(newTotal)}). Une page lourde charge lentement, surtout sur mobile et en 4G.`,
      previousValue: weight(oldTotal),
      currentValue: weight(newTotal),
    }]
  },
})

// ═══════════════════════════════════════════════════════════════════════
//  B. AUDIT ABSOLU (recommendation) — à chaque crawl, signale ce qui est mauvais
// ═══════════════════════════════════════════════════════════════════════

// LCP au-delà du seuil "good" Google (2,5 s).
registerRule({
  id: 'rec_perf_lcp_poor',
  run(ctx) {
    const lcp = ctx.newPerf?.lcpMs
    if (lcp == null) return []
    const rating = rateLcp(lcp)
    if (rating === 'good') return []

    return [{
      type: 'rec_perf_lcp_poor',
      severity: rating === 'poor' ? 'warning' : 'info',
      message: `Votre page met ${seconds(lcp)} à afficher son contenu principal (recommandé : moins de 2,5 s). Une page lente perd des positions Google et des visiteurs.`,
      previousValue: null,
      currentValue: seconds(lcp),
    }]
  },
})

// CLS au-delà du seuil "good" Google (0,1).
registerRule({
  id: 'rec_perf_cls_poor',
  run(ctx) {
    const cls = ctx.newPerf?.cls
    if (cls == null) return []
    const rating = rateCls(cls)
    if (rating === 'good') return []

    return [{
      type: 'rec_perf_cls_poor',
      severity: rating === 'poor' ? 'warning' : 'info',
      message: `Le contenu de votre page se décale pendant le chargement. Vos visiteurs cliquent parfois au mauvais endroit — et Google pénalise les pages instables.`,
      previousValue: null,
      currentValue: String(cls),
    }]
  },
})

// Serveur lent dans l'absolu (TTFB > 800 ms, seuil "good" Google).
registerRule({
  id: 'rec_perf_ttfb_slow',
  run(ctx) {
    const ttfb = ctx.newPerf?.ttfbMs
    if (ttfb == null || ttfb <= PERF_THRESHOLDS.ttfb.good) return []

    return [{
      type: 'rec_perf_ttfb_slow',
      severity: 'info',
      message: `Votre serveur met ${ttfb} ms à répondre (recommandé : moins de 800 ms). Un hébergement ou un cache plus rapide accélérerait le chargement de tout le site.`,
      previousValue: null,
      currentValue: `${ttfb} ms`,
    }]
  },
})

// Page lourde dans l'absolu (seuils Lighthouse : > 1,6 MB = à surveiller, > 5 MB = excessif).
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
      message: `Cette page pèse ${weight(total)} (recommandé : moins de 1,6 MB). Compresser les images et alléger le JavaScript accélérerait son chargement.`,
      previousValue: null,
      currentValue: weight(total),
    }]
  },
})
