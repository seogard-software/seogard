import { describe, expect, it } from 'vitest'
import { RESOLVE_WHEN, clearedRuleIds } from '../../crawler/comparator'
import type { RuleContext } from '../../crawler/rules/engine'

// Fixture minimal : les prédicats ne lisent que newMeta / newPerf / siteContext.
function ctx(newMeta: Record<string, unknown>, extra: Record<string, unknown> = {}): RuleContext {
  return { newMeta, ...extra } as unknown as RuleContext
}
const h1 = (text: string) => ({ level: 1, text })

// État 100 % sain (toutes les conditions réparées), perf incluse.
const HEALTHY = ctx(
  {
    title: 'Mon titre', description: 'Une description', charset: 'utf-8',
    viewport: 'width=device-width', lang: 'fr', ogImage: 'https://x/i.png',
    ogTitle: 'OG', jsonLdTypes: ['Article'], jsonLdAuthor: 'Jane', hasFaqSchema: true,
    hreflangs: [{ lang: 'en', href: '/en' }], headings: [{ level: 1, text: 'Page' }, { level: 2, text: 'Sous-titre' }],
    wordCount: 500,
  },
  { siteContext: { hasLlmsTxt: true }, newPerf: { lcpMs: 1000, cls: 0.02, ttfbMs: 200, weightTotalKb: 500 } },
)

// Les 21 règles auto-résolues (liste blanche figée). Le verrou empêche tout ajout/retrait
// accidentel (notamment des règles à validation humaine).
const EXPECTED_KEYS = [
  'charset_missing', 'faq_schema_removed', 'h1_missing', 'h1_multiple',
  'heading_hierarchy_broken', 'hreflang_removed', 'lang_attribute_missing',
  'llms_txt_removed', 'meta_description_missing', 'meta_title_missing',
  'og_image_removed', 'og_title_removed', 'perf_cls_degradation',
  'perf_lcp_degradation', 'perf_page_weight_explosion', 'perf_ttfb_increase',
  'structured_data_author_removed', 'structured_data_removed', 'thin_content',
  'title_duplicate_of_h1', 'viewport_missing',
].sort()

describe('RESOLVE_WHEN — liste blanche figée', () => {
  it('contient EXACTEMENT les 21 règles attendues', () => {
    expect(Object.keys(RESOLVE_WHEN).sort()).toEqual(EXPECTED_KEYS)
  })

  it('exclut les règles à validation humaine (jamais auto-résolues)', () => {
    const forbidden = [
      'meta_title_changed', 'meta_description_changed', 'canonical_changed', 'h1_changed',
      'hreflang_changed', 'lang_attribute_changed', 'robots_txt_changed',
      'ai_crawlers_blocked_changed', 'word_count_changed',
      'canonical_missing', 'status_code_changed', 'noindex_added', 'content_removed',
    ]
    for (const id of forbidden) expect(RESOLVE_WHEN[id]).toBeUndefined()
  })
})

describe('clearedRuleIds — agrégation', () => {
  it('état 100 % sain (avec perf) → les 21 règles', () => {
    expect(clearedRuleIds(HEALTHY).sort()).toEqual(EXPECTED_KEYS)
  })

  it('sans données perf → aucune règle perf_* résolue (donnée absente = conservée)', () => {
    const noPerf = ctx({ ...(HEALTHY.newMeta as Record<string, unknown>) }, { siteContext: { hasLlmsTxt: true } })
    const cleared = clearedRuleIds(noPerf)
    expect(cleared).toHaveLength(17)
    expect(cleared.some(id => id.startsWith('perf_'))).toBe(false)
  })

  it('aucune fermeture quand tout est cassé (sous-ensemble vide attendu)', () => {
    const broken = ctx(
      { title: null, description: null, charset: null, viewport: null, lang: null, ogImage: null, ogTitle: null, jsonLdTypes: [], jsonLdAuthor: null, hasFaqSchema: false, hreflangs: [], headings: [], wordCount: 50 },
      { newPerf: { lcpMs: 6000, cls: 0.5, ttfbMs: 3000, weightTotalKb: 9000 } },
    )
    const cleared = clearedRuleIds(broken)
    // h1_missing/h1_multiple/heading/title_duplicate restent "sains" sur une page sans titre ni H1
    // (pas de défaut de ce type), mais AUCUNE des règles "présence/perf" cassées n'est fermée :
    for (const id of ['meta_title_missing', 'meta_description_missing', 'charset_missing', 'viewport_missing', 'lang_attribute_missing', 'og_image_removed', 'og_title_removed', 'structured_data_removed', 'structured_data_author_removed', 'faq_schema_removed', 'hreflang_removed', 'thin_content', 'perf_lcp_degradation', 'perf_cls_degradation', 'perf_ttfb_increase', 'perf_page_weight_explosion']) {
      expect(cleared).not.toContain(id)
    }
  })
})

describe('RESOLVE_WHEN — prédicats (sain → true, cassé → false, donnée absente → false)', () => {
  it('meta_title_missing', () => {
    expect(RESOLVE_WHEN.meta_title_missing!(ctx({ title: 'Accueil' }))).toBe(true)
    expect(RESOLVE_WHEN.meta_title_missing!(ctx({ title: null }))).toBe(false)
  })

  it('meta_description_missing', () => {
    expect(RESOLVE_WHEN.meta_description_missing!(ctx({ description: 'desc' }))).toBe(true)
    expect(RESOLVE_WHEN.meta_description_missing!(ctx({ description: null }))).toBe(false)
  })

  it('h1_missing (ignore les H1 vides)', () => {
    expect(RESOLVE_WHEN.h1_missing!(ctx({ headings: [h1('Titre')] }))).toBe(true)
    expect(RESOLVE_WHEN.h1_missing!(ctx({ headings: [h1('')] }))).toBe(false) // H1 vide ne compte pas
    expect(RESOLVE_WHEN.h1_missing!(ctx({ headings: [] }))).toBe(false)
    expect(RESOLVE_WHEN.h1_missing!(ctx({}))).toBe(false) // headings absent
  })

  it('charset_missing', () => {
    expect(RESOLVE_WHEN.charset_missing!(ctx({ charset: 'utf-8' }))).toBe(true)
    expect(RESOLVE_WHEN.charset_missing!(ctx({ charset: null }))).toBe(false)
  })

  it('viewport_missing', () => {
    expect(RESOLVE_WHEN.viewport_missing!(ctx({ viewport: 'width=device-width' }))).toBe(true)
    expect(RESOLVE_WHEN.viewport_missing!(ctx({ viewport: null }))).toBe(false)
  })

  it('lang_attribute_missing', () => {
    expect(RESOLVE_WHEN.lang_attribute_missing!(ctx({ lang: 'fr' }))).toBe(true)
    expect(RESOLVE_WHEN.lang_attribute_missing!(ctx({ lang: null }))).toBe(false)
  })

  it('og_image_removed', () => {
    expect(RESOLVE_WHEN.og_image_removed!(ctx({ ogImage: 'https://x/i.png' }))).toBe(true)
    expect(RESOLVE_WHEN.og_image_removed!(ctx({ ogImage: null }))).toBe(false)
  })

  it('og_title_removed', () => {
    expect(RESOLVE_WHEN.og_title_removed!(ctx({ ogTitle: 'T' }))).toBe(true)
    expect(RESOLVE_WHEN.og_title_removed!(ctx({ ogTitle: null }))).toBe(false)
  })

  it('structured_data_removed', () => {
    expect(RESOLVE_WHEN.structured_data_removed!(ctx({ jsonLdTypes: ['Article'] }))).toBe(true)
    expect(RESOLVE_WHEN.structured_data_removed!(ctx({ jsonLdTypes: [] }))).toBe(false)
    expect(RESOLVE_WHEN.structured_data_removed!(ctx({}))).toBe(false)
  })

  it('structured_data_author_removed', () => {
    expect(RESOLVE_WHEN.structured_data_author_removed!(ctx({ jsonLdAuthor: 'Jane' }))).toBe(true)
    expect(RESOLVE_WHEN.structured_data_author_removed!(ctx({ jsonLdAuthor: null }))).toBe(false)
  })

  it('faq_schema_removed', () => {
    expect(RESOLVE_WHEN.faq_schema_removed!(ctx({ hasFaqSchema: true }))).toBe(true)
    expect(RESOLVE_WHEN.faq_schema_removed!(ctx({ hasFaqSchema: false }))).toBe(false)
  })

  it('hreflang_removed', () => {
    expect(RESOLVE_WHEN.hreflang_removed!(ctx({ hreflangs: [{ lang: 'fr', href: '/' }] }))).toBe(true)
    expect(RESOLVE_WHEN.hreflang_removed!(ctx({ hreflangs: [] }))).toBe(false)
    expect(RESOLVE_WHEN.hreflang_removed!(ctx({}))).toBe(false)
  })

  it('llms_txt_removed (site-level)', () => {
    expect(RESOLVE_WHEN.llms_txt_removed!(ctx({}, { siteContext: { hasLlmsTxt: true } }))).toBe(true)
    expect(RESOLVE_WHEN.llms_txt_removed!(ctx({}, { siteContext: { hasLlmsTxt: false } }))).toBe(false)
    expect(RESOLVE_WHEN.llms_txt_removed!(ctx({}))).toBe(false) // siteContext absent
  })

  it('h1_multiple', () => {
    expect(RESOLVE_WHEN.h1_multiple!(ctx({ headings: [h1('a')] }))).toBe(true)
    expect(RESOLVE_WHEN.h1_multiple!(ctx({ headings: [h1('a'), h1('b')] }))).toBe(false)
  })

  it('heading_hierarchy_broken (vide = sain)', () => {
    expect(RESOLVE_WHEN.heading_hierarchy_broken!(ctx({ headings: [{ level: 1, text: 'a' }, { level: 2, text: 'b' }] }))).toBe(true)
    expect(RESOLVE_WHEN.heading_hierarchy_broken!(ctx({ headings: [{ level: 1, text: 'a' }, { level: 3, text: 'c' }] }))).toBe(false)
    expect(RESOLVE_WHEN.heading_hierarchy_broken!(ctx({ headings: [] }))).toBe(true)
  })

  it('title_duplicate_of_h1 (insensible à la casse/espaces)', () => {
    expect(RESOLVE_WHEN.title_duplicate_of_h1!(ctx({ title: 'Accueil', headings: [h1('Bienvenue')] }))).toBe(true)
    expect(RESOLVE_WHEN.title_duplicate_of_h1!(ctx({ title: ' Accueil ', headings: [h1('accueil')] }))).toBe(false)
    expect(RESOLVE_WHEN.title_duplicate_of_h1!(ctx({ title: null, headings: [] }))).toBe(true)
  })

  it('thin_content (seuil 200 mots)', () => {
    expect(RESOLVE_WHEN.thin_content!(ctx({ wordCount: 250 }))).toBe(true)
    expect(RESOLVE_WHEN.thin_content!(ctx({ wordCount: 200 }))).toBe(true) // borne incluse
    expect(RESOLVE_WHEN.thin_content!(ctx({ wordCount: 199 }))).toBe(false)
  })

  it('perf_lcp_degradation (good < 2,5 s)', () => {
    expect(RESOLVE_WHEN.perf_lcp_degradation!(ctx({}, { newPerf: { lcpMs: 1800 } }))).toBe(true)
    expect(RESOLVE_WHEN.perf_lcp_degradation!(ctx({}, { newPerf: { lcpMs: 5000 } }))).toBe(false)
    expect(RESOLVE_WHEN.perf_lcp_degradation!(ctx({}, { newPerf: { lcpMs: null } }))).toBe(false)
    expect(RESOLVE_WHEN.perf_lcp_degradation!(ctx({}))).toBe(false)
  })

  it('perf_cls_degradation (good ≤ 0,1)', () => {
    expect(RESOLVE_WHEN.perf_cls_degradation!(ctx({}, { newPerf: { cls: 0.05 } }))).toBe(true)
    expect(RESOLVE_WHEN.perf_cls_degradation!(ctx({}, { newPerf: { cls: 0.4 } }))).toBe(false)
    expect(RESOLVE_WHEN.perf_cls_degradation!(ctx({}))).toBe(false)
  })

  it('perf_ttfb_increase (good < 800 ms)', () => {
    expect(RESOLVE_WHEN.perf_ttfb_increase!(ctx({}, { newPerf: { ttfbMs: 300 } }))).toBe(true)
    expect(RESOLVE_WHEN.perf_ttfb_increase!(ctx({}, { newPerf: { ttfbMs: 2500 } }))).toBe(false)
    expect(RESOLVE_WHEN.perf_ttfb_increase!(ctx({}))).toBe(false)
  })

  it('perf_page_weight_explosion (good < 1,6 MB)', () => {
    expect(RESOLVE_WHEN.perf_page_weight_explosion!(ctx({}, { newPerf: { weightTotalKb: 800 } }))).toBe(true)
    expect(RESOLVE_WHEN.perf_page_weight_explosion!(ctx({}, { newPerf: { weightTotalKb: 9000 } }))).toBe(false)
    expect(RESOLVE_WHEN.perf_page_weight_explosion!(ctx({}))).toBe(false)
  })
})
