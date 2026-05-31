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

// ─── Régressions (event) ─────────────────────────────────────────────

describe('perf_ttfb_increase', () => {
  it('ne fire pas sans baseline (1er crawl)', () => {
    expect(runRule('perf_ttfb_increase', ctx(null, perf({ ttfbMs: 1500 })))).toHaveLength(0)
  })
  it('fire si TTFB ≥ 2× ET > 600ms', () => {
    const r = runRule('perf_ttfb_increase', ctx(perf({ ttfbMs: 300 }), perf({ ttfbMs: 700 })))
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('warning')
  })
  it('ne fire pas sur micro-variation sous 600ms', () => {
    expect(runRule('perf_ttfb_increase', ctx(perf({ ttfbMs: 200 }), perf({ ttfbMs: 500 })))).toHaveLength(0)
  })
  it('ne fire pas si baseline à 0 (artefact de mesure)', () => {
    expect(runRule('perf_ttfb_increase', ctx(perf({ ttfbMs: 0 }), perf({ ttfbMs: 700 })))).toHaveLength(0)
  })
})

describe('perf_lcp_degradation', () => {
  it('fire si franchit un palier vers le pire ET +30%', () => {
    // good (2000) → poor (4500), +125%
    const r = runRule('perf_lcp_degradation', ctx(perf({ lcpMs: 2000 }), perf({ lcpMs: 4500 })))
    expect(r).toHaveLength(1)
  })
  it('ne fire pas si même palier malgré une hausse', () => {
    // good → good (toujours sous 2500)
    expect(runRule('perf_lcp_degradation', ctx(perf({ lcpMs: 1000 }), perf({ lcpMs: 2000 })))).toHaveLength(0)
  })
  it('ne fire pas si palier franchi mais hausse < 30%', () => {
    // 2400 (good) → 2600 (needs) mais +8%
    expect(runRule('perf_lcp_degradation', ctx(perf({ lcpMs: 2400 }), perf({ lcpMs: 2600 })))).toHaveLength(0)
  })
})

describe('perf_cls_degradation', () => {
  it('fire si franchit un palier vers le pire', () => {
    // good (0.05) → poor (0.4)
    expect(runRule('perf_cls_degradation', ctx(perf({ cls: 0.05 }), perf({ cls: 0.4 })))).toHaveLength(1)
  })
  it('ne fire pas si reste dans le même palier', () => {
    expect(runRule('perf_cls_degradation', ctx(perf({ cls: 0.02 }), perf({ cls: 0.08 })))).toHaveLength(0)
  })
})

describe('perf_page_weight_explosion', () => {
  it('fire si poids total +50% ET delta > 200KB', () => {
    const r = runRule('perf_page_weight_explosion', ctx(perf({ weightTotalKb: 800 }), perf({ weightTotalKb: 1300 })))
    expect(r).toHaveLength(1)
  })
  it('ne fire pas si hausse < 50%', () => {
    expect(runRule('perf_page_weight_explosion', ctx(perf({ weightTotalKb: 800 }), perf({ weightTotalKb: 1000 })))).toHaveLength(0)
  })
  it('ne fire pas si baseline à 0 (évite division par zéro / NaN)', () => {
    expect(runRule('perf_page_weight_explosion', ctx(perf({ weightTotalKb: 0 }), perf({ weightTotalKb: 1000 })))).toHaveLength(0)
  })
})

// ─── Audit absolu (recommendation) ───────────────────────────────────

describe('rec_perf_lcp_poor', () => {
  it('ne fire pas si good', () => {
    expect(runRule('rec_perf_lcp_poor', ctx(null, perf({ lcpMs: 2000 })))).toHaveLength(0)
  })
  it('info si needs-improvement, warning si poor', () => {
    expect(runRule('rec_perf_lcp_poor', ctx(null, perf({ lcpMs: 3000 })))[0].severity).toBe('info')
    expect(runRule('rec_perf_lcp_poor', ctx(null, perf({ lcpMs: 5000 })))[0].severity).toBe('warning')
  })
  it('ne fire pas si non mesuré (null)', () => {
    expect(runRule('rec_perf_lcp_poor', ctx(null, perf({ lcpMs: null })))).toHaveLength(0)
  })
})

describe('rec_perf_ttfb_slow', () => {
  it('fire au-delà de 800ms', () => {
    expect(runRule('rec_perf_ttfb_slow', ctx(null, perf({ ttfbMs: 900 })))).toHaveLength(1)
  })
  it('ne fire pas en dessous de 800ms', () => {
    expect(runRule('rec_perf_ttfb_slow', ctx(null, perf({ ttfbMs: 400 })))).toHaveLength(0)
  })
})

describe('rec_perf_page_heavy', () => {
  it('ne fire pas si bon (≤ 1,6 MB)', () => {
    expect(runRule('rec_perf_page_heavy', ctx(null, perf({ weightTotalKb: 1500 })))).toHaveLength(0)
  })
  it('info entre 1,6 et 5 MB', () => {
    const r = runRule('rec_perf_page_heavy', ctx(null, perf({ weightTotalKb: 3000 })))
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('info')
  })
  it('warning au-delà de 5 MB (payload excessif)', () => {
    const r = runRule('rec_perf_page_heavy', ctx(null, perf({ weightTotalKb: 8000 })))
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('warning')
  })
})
