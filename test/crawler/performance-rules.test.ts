import { describe, expect, it } from 'vitest'
import type { RuleContext } from '../../crawler/rules/engine'
import { runRule } from '../../crawler/rules/engine'
import type { PageMeta } from '../../crawler/fetcher'
import type { PerfMetrics } from '../../shared/types/perf'
import '../../crawler/rules/performance'

function perf(overrides: Partial<PerfMetrics> = {}): PerfMetrics {
  return {
    ttfbMs: 200,
    lcpMs: 2000,
    cls: 0.05,
    weightTotalKb: 800,
    weightHtmlKb: 20,
    weightCssKb: 80,
    weightJsKb: 300,
    weightImgKb: 350,
    weightFontKb: 50,
    weightOtherKb: 0,
    requestCount: 30,
    ...overrides,
  }
}

function ctx(oldPerf: PerfMetrics | null, newPerf: PerfMetrics | null): RuleContext {
  return {
    pageUrl: 'https://example.com/page',
    finalUrl: 'https://example.com/page',
    oldMeta: null,
    newMeta: {} as PageMeta,
    oldStatusCode: null,
    newStatusCode: 200,
    renderedMeta: null,
    ssrContentLength: 5000,
    csrContentLength: 6000,
    oldPerf,
    newPerf,
  }
}

// ─── POIDS DE PAGE = la SEULE régression perf (déterministe) ──────────────

describe('perf_page_weight_explosion', () => {
  it('fire si poids total +50% ET delta > 200KB', () => {
    const r = runRule('perf_page_weight_explosion', ctx(perf({ weightTotalKb: 800 }), perf({ weightTotalKb: 1300 })))
    expect(r).toHaveLength(1)
    expect(r[0]!.severity).toBe('warning')
  })
  it('ne fire pas si hausse < 50%', () => {
    expect(runRule('perf_page_weight_explosion', ctx(perf({ weightTotalKb: 800 }), perf({ weightTotalKb: 1000 })))).toHaveLength(0)
  })
  it('ne fire pas si baseline à 0 (évite division par zéro / NaN)', () => {
    expect(runRule('perf_page_weight_explosion', ctx(perf({ weightTotalKb: 0 }), perf({ weightTotalKb: 1000 })))).toHaveLength(0)
  })
})

describe('rec_perf_page_heavy', () => {
  it('ne fire pas si bon (≤ 1,6 MB)', () => {
    expect(runRule('rec_perf_page_heavy', ctx(null, perf({ weightTotalKb: 1500 })))).toHaveLength(0)
  })
  it('info entre 1,6 et 5 MB', () => {
    const r = runRule('rec_perf_page_heavy', ctx(null, perf({ weightTotalKb: 3000 })))
    expect(r).toHaveLength(1)
    expect(r[0]!.severity).toBe('info')
  })
  it('warning au-delà de 5 MB (payload excessif)', () => {
    const r = runRule('rec_perf_page_heavy', ctx(null, perf({ weightTotalKb: 8000 })))
    expect(r).toHaveLength(1)
    expect(r[0]!.severity).toBe('warning')
  })
})

// ─── Web Vitals temporels = MONITORING pur, AUCUNE règle ──────────────────

describe('LCP / CLS / TTFB ne sont plus des règles (monitoring only)', () => {
  it('les 6 règles perf temporelles sont supprimées → 0 alerte possible', () => {
    // Synthétique one-shot trop instable → plus de régression ni d'audit sur ces métriques.
    const degraded = ctx(perf({ lcpMs: 800, cls: 0.01, ttfbMs: 200 }), perf({ lcpMs: 5000, cls: 0.5, ttfbMs: 3000 }))
    for (const id of ['perf_lcp_degradation', 'perf_cls_degradation', 'perf_ttfb_increase', 'rec_perf_lcp_poor', 'rec_perf_cls_poor', 'rec_perf_ttfb_slow']) {
      expect(() => runRule(id, degraded)).toThrow() // règle introuvable dans le registre
    }
  })
})
