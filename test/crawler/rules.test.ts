import { describe, it, expect } from 'vitest'
import type { RuleContext } from '../../crawler/rules/engine'
import { runRule, runAllRules } from '../../crawler/rules/engine'
import type { PageMeta } from '../../crawler/fetcher'

// Import all rule files to register them
import '../../crawler/rules/meta'
import '../../crawler/rules/indexing'
import '../../crawler/rules/status-code'
import '../../crawler/rules/ssr-csr'
import '../../crawler/rules/heading'
import '../../crawler/rules/content'
import '../../crawler/rules/structured-data'
import '../../crawler/rules/technical'
import '../../crawler/rules/opengraph'
import '../../crawler/rules/i18n'
import '../../crawler/rules/redirect'
import '../../crawler/rules/geo'

// --- Test helpers ---

function baseMeta(overrides: Partial<PageMeta> = {}): PageMeta {
  return {
    title: 'Test Page Title Here',
    description: 'A test description that is long enough to be valid and useful for testing.',
    canonical: 'https://example.com/page',
    robots: null,
    ogTitle: 'Test Page',
    ogDescription: 'Test description',
    ogImage: 'https://example.com/img.jpg',
    ogUrl: null,
    ogType: null,
    twitterCard: null,
    twitterTitle: null,
    twitterImage: null,
    viewport: null,
    lang: null,
    charset: null,
    hreflangs: [],
    jsonLdTypes: [],
    jsonLdValid: true,
    jsonLdAuthor: null,
    jsonLdDatePublished: null,
    jsonLdPublisher: null,
    hasFaqSchema: false,
    hasMetaRefresh: false,
    hasMixedContent: false,
    isSoft404: false,
    wordCount: 500,
    headings: [],
    internalLinks: [],
    externalLinks: [],
    internalLinkCount: 0,
    externalLinkCount: 0,
    images: [],
    imgCount: 0,
    ttfbMs: 100,
    totalFetchMs: 200,
    htmlSize: 5000,
    responseHeaders: {
      cacheControl: null,
      contentType: 'text/html',
      xRobotsTag: null,
      server: null,
    },
    finalUrl: 'https://example.com/page',
    isRedirected: false,
    hasLists: false,
    hasDefinitionLists: false,
    hasHeader: false,
    hasNav: false,
    hasMain: false,
    hasFooter: false,
    hasArticle: false,
    favicon: null,
    ...overrides,
  }
}

/** Build headings array from level numbers (convenience) */
function headingsFrom(...levels: number[]) {
  return levels.map((l, i) => ({ level: l, text: `Heading ${i + 1}` }))
}

/** Build images without alt attributes */
function imgsWithoutAlt(count: number) {
  return Array.from({ length: count }, (_, i) => ({ src: `img${i}.jpg`, alt: null as string | null, inLink: false }))
}

function ctx(overrides: Partial<RuleContext> = {}): RuleContext {
  return {
    pageUrl: 'https://example.com/page',
    finalUrl: 'https://example.com/page',
    oldMeta: null,
    newMeta: baseMeta(),
    oldStatusCode: null,
    newStatusCode: 200,
    renderedMeta: null,
    ssrContentLength: 5000,
    csrContentLength: null,
    ...overrides,
  }
}

// ============================================================
// META RULES
// ============================================================

describe('meta_title_missing', () => {
  it('fires when title is removed', () => {
    const results = runRule('meta_title_missing', ctx({
      oldMeta: baseMeta({ title: 'Old Title' }),
      newMeta: baseMeta({ title: null }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire on first crawl', () => {
    expect(runRule('meta_title_missing', ctx({ oldMeta: null }))).toHaveLength(0)
  })

  it('does not fire when title exists', () => {
    expect(runRule('meta_title_missing', ctx({
      oldMeta: baseMeta({ title: 'Old' }),
      newMeta: baseMeta({ title: 'New' }),
    }))).toHaveLength(0)
  })
})

describe('meta_title_changed', () => {
  it('fires when title changes', () => {
    const results = runRule('meta_title_changed', ctx({
      oldMeta: baseMeta({ title: 'Old Title' }),
      newMeta: baseMeta({ title: 'New Title' }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
  })

  it('does not fire when title is identical', () => {
    expect(runRule('meta_title_changed', ctx({
      oldMeta: baseMeta({ title: 'Same' }),
      newMeta: baseMeta({ title: 'Same' }),
    }))).toHaveLength(0)
  })
})

describe('meta_description_missing', () => {
  it('fires when description is removed', () => {
    const results = runRule('meta_description_missing', ctx({
      oldMeta: baseMeta({ description: 'Was here' }),
      newMeta: baseMeta({ description: null }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })
})

describe('meta_description_changed', () => {
  it('fires when description changes', () => {
    const results = runRule('meta_description_changed', ctx({
      oldMeta: baseMeta({ description: 'Old desc' }),
      newMeta: baseMeta({ description: 'New desc' }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('info')
  })
})

describe('canonical_missing', () => {
  it('fires when canonical is removed', () => {
    const results = runRule('canonical_missing', ctx({
      oldMeta: baseMeta({ canonical: 'https://example.com/page' }),
      newMeta: baseMeta({ canonical: null }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })
})

describe('canonical_changed', () => {
  it('fires when canonical changes', () => {
    const results = runRule('canonical_changed', ctx({
      oldMeta: baseMeta({ canonical: 'https://example.com/old' }),
      newMeta: baseMeta({ canonical: 'https://example.com/new' }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
  })
})

// ============================================================
// INDEXING RULES
// ============================================================

describe('noindex_added', () => {
  it('fires when noindex is added', () => {
    const results = runRule('noindex_added', ctx({
      oldMeta: baseMeta({ robots: 'index, follow' }),
      newMeta: baseMeta({ robots: 'noindex, follow' }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire when noindex was already present', () => {
    expect(runRule('noindex_added', ctx({
      oldMeta: baseMeta({ robots: 'noindex' }),
      newMeta: baseMeta({ robots: 'noindex' }),
    }))).toHaveLength(0)
  })
})

describe('robots_txt_changed', () => {
  it('fires when robots meta changes (non-noindex)', () => {
    const results = runRule('robots_txt_changed', ctx({
      oldMeta: baseMeta({ robots: 'index, follow' }),
      newMeta: baseMeta({ robots: 'index, nofollow' }),
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire when noindex is added (handled by noindex_added)', () => {
    expect(runRule('robots_txt_changed', ctx({
      oldMeta: baseMeta({ robots: 'index' }),
      newMeta: baseMeta({ robots: 'noindex' }),
    }))).toHaveLength(0)
  })
})

// ============================================================
// STATUS CODE RULES
// ============================================================

describe('status_code_changed', () => {
  it('fires critical for 4xx/5xx', () => {
    const results = runRule('status_code_changed', ctx({
      oldStatusCode: 200,
      newStatusCode: 404,
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('fires warning for non-error changes', () => {
    const results = runRule('status_code_changed', ctx({
      oldStatusCode: 200,
      newStatusCode: 301,
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
  })

  it('does not fire on first crawl', () => {
    expect(runRule('status_code_changed', ctx({
      oldStatusCode: null,
      newStatusCode: 200,
    }))).toHaveLength(0)
  })
})

// ============================================================
// SSR/CSR RULES
// ============================================================

describe('ssr_content_mismatch', () => {
  it('fires when SSR is 2% of CSR (nearly empty SSR)', () => {
    const results = runRule('ssr_content_mismatch', ctx({
      ssrContentLength: 100,
      csrContentLength: 5000,
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('fires when SSR is 0% — 503 error page vs real CSR (286b vs 248KB)', () => {
    const results = runRule('ssr_content_mismatch', ctx({
      ssrContentLength: 286,
      csrContentLength: 248474,
    }))
    expect(results).toHaveLength(1)
    expect(results[0].message).toContain('0%')
  })

  it('fires at exactly 9% (just below threshold)', () => {
    const results = runRule('ssr_content_mismatch', ctx({
      ssrContentLength: 900,
      csrContentLength: 10000,
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire at exactly 10% (boundary)', () => {
    expect(runRule('ssr_content_mismatch', ctx({
      ssrContentLength: 1000,
      csrContentLength: 10000,
    }))).toHaveLength(0)
  })

  it('does not fire at 15% (light SSR shell is normal)', () => {
    expect(runRule('ssr_content_mismatch', ctx({
      ssrContentLength: 1500,
      csrContentLength: 10000,
    }))).toHaveLength(0)
  })

  it('does not fire when SSR is 30% of CSR (partial SSR is normal)', () => {
    expect(runRule('ssr_content_mismatch', ctx({
      ssrContentLength: 1500,
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })

  it('does not fire when SSR is 80% of CSR (full SSR)', () => {
    expect(runRule('ssr_content_mismatch', ctx({
      ssrContentLength: 4000,
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })

  it('does not fire when CSR is blocked', () => {
    expect(runRule('ssr_content_mismatch', ctx({
      ssrContentLength: 100,
      csrContentLength: 500, // <2000 = blocked
    }))).toHaveLength(0)
  })

  it('does not fire when SSR returned an error (503)', () => {
    expect(runRule('ssr_content_mismatch', ctx({
      newStatusCode: 503,
      ssrContentLength: 100,
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })
})

describe('ssr_rendering_failed', () => {
  it('fires when SSR <200b and CSR >1000b', () => {
    const results = runRule('ssr_rendering_failed', ctx({
      ssrContentLength: 50,
      csrContentLength: 5000,
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire when SSR is large enough', () => {
    expect(runRule('ssr_rendering_failed', ctx({
      ssrContentLength: 3000,
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })

  it('does not fire when SSR returned a 502', () => {
    expect(runRule('ssr_rendering_failed', ctx({
      newStatusCode: 502,
      ssrContentLength: 50,
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })
})

describe('ssr_title_mismatch', () => {
  it('fires when SSR title differs from CSR', () => {
    const results = runRule('ssr_title_mismatch', ctx({
      newMeta: baseMeta({ title: 'SSR Title' }),
      renderedMeta: baseMeta({ title: 'CSR Title' }),
      csrContentLength: 5000,
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire for entity differences (normalized)', () => {
    expect(runRule('ssr_title_mismatch', ctx({
      newMeta: baseMeta({ title: 'Product &amp; Service' }),
      renderedMeta: baseMeta({ title: 'Product & Service' }),
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })

  it('does not fire for &nbsp; vs space differences', () => {
    expect(runRule('ssr_title_mismatch', ctx({
      newMeta: baseMeta({ title: 'Tracker\u00A0: prix' }),
      renderedMeta: baseMeta({ title: 'Tracker : prix' }),
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })

  it('does not fire when SSR returned 503 (e.g. "503 Backend fetch failed")', () => {
    expect(runRule('ssr_title_mismatch', ctx({
      newStatusCode: 503,
      newMeta: baseMeta({ title: '503 Backend fetch failed' }),
      renderedMeta: baseMeta({ title: 'Whirlpool ExtraSpace MWF420BL : meilleur prix - Les Numériques' }),
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })

  it('does not fire when SSR returned 404', () => {
    expect(runRule('ssr_title_mismatch', ctx({
      newStatusCode: 404,
      newMeta: baseMeta({ title: 'Page not found' }),
      renderedMeta: baseMeta({ title: 'Real Page Title' }),
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })
})

describe('ssr_meta_description_mismatch', () => {
  it('does not fire for double-encoded &amp;nbsp;', () => {
    expect(runRule('ssr_meta_description_mismatch', ctx({
      newMeta: baseMeta({ description: 'Magic&amp;nbsp;5 Pro' }),
      renderedMeta: baseMeta({ description: 'Magic\u00A05 Pro' }),
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })

  it('fires for genuinely different descriptions', () => {
    const results = runRule('ssr_meta_description_mismatch', ctx({
      newMeta: baseMeta({ description: 'SSR description' }),
      renderedMeta: baseMeta({ description: 'Completely different CSR description' }),
      csrContentLength: 5000,
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire when SSR returned 503', () => {
    expect(runRule('ssr_meta_description_mismatch', ctx({
      newStatusCode: 503,
      newMeta: baseMeta({ description: 'Error page description' }),
      renderedMeta: baseMeta({ description: 'Real page description' }),
      csrContentLength: 5000,
    }))).toHaveLength(0)
  })
})

// ============================================================
// HEADING RULES
// ============================================================

describe('h1_missing', () => {
  it('fires when H1 is removed', () => {
    const results = runRule('h1_missing', ctx({
      oldMeta: baseMeta({ headings: [{ level: 1, text: 'Old H1' }] }),
      newMeta: baseMeta({ headings: [] }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire on first crawl', () => {
    expect(runRule('h1_missing', ctx({ oldMeta: null }))).toHaveLength(0)
  })

  it('does not fire when H1 still exists', () => {
    expect(runRule('h1_missing', ctx({
      oldMeta: baseMeta({ headings: [{ level: 1, text: 'Old' }] }),
      newMeta: baseMeta({ headings: [{ level: 1, text: 'New' }] }),
    }))).toHaveLength(0)
  })
})

describe('h1_multiple', () => {
  it('fires when multiple H1s appear', () => {
    const results = runRule('h1_multiple', ctx({
      oldMeta: baseMeta({ headings: [{ level: 1, text: 'Only H1' }] }),
      newMeta: baseMeta({ headings: [{ level: 1, text: 'H1 A' }, { level: 1, text: 'H1 B' }, { level: 1, text: 'H1 C' }] }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
  })

  it('does not fire if already had multiple', () => {
    expect(runRule('h1_multiple', ctx({
      oldMeta: baseMeta({ headings: [{ level: 1, text: 'A' }, { level: 1, text: 'B' }] }),
      newMeta: baseMeta({ headings: [{ level: 1, text: 'A' }, { level: 1, text: 'B' }, { level: 1, text: 'C' }] }),
    }))).toHaveLength(0)
  })
})

describe('h1_changed', () => {
  it('fires when H1 text changes', () => {
    const results = runRule('h1_changed', ctx({
      oldMeta: baseMeta({ headings: [{ level: 1, text: 'Old H1' }] }),
      newMeta: baseMeta({ headings: [{ level: 1, text: 'New H1' }] }),
    }))
    expect(results).toHaveLength(1)
  })
})

describe('heading_hierarchy_broken', () => {
  it('fires when hierarchy breaks (H1 → H3 skip)', () => {
    const results = runRule('heading_hierarchy_broken', ctx({
      oldMeta: baseMeta({ headings: headingsFrom(1, 2, 3) }),
      newMeta: baseMeta({ headings: headingsFrom(1, 3, 4) }),
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire for valid hierarchy', () => {
    expect(runRule('heading_hierarchy_broken', ctx({
      oldMeta: baseMeta({ headings: headingsFrom(1, 2, 3) }),
      newMeta: baseMeta({ headings: headingsFrom(1, 2, 2, 3) }),
    }))).toHaveLength(0)
  })
})

describe('title_duplicate_of_h1', () => {
  it('fires when title becomes identical to H1', () => {
    const results = runRule('title_duplicate_of_h1', ctx({
      oldMeta: baseMeta({ title: 'Different Title', headings: [{ level: 1, text: 'Page Content' }] }),
      newMeta: baseMeta({ title: 'Same Text', headings: [{ level: 1, text: 'Same Text' }] }),
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire if was already duplicate', () => {
    expect(runRule('title_duplicate_of_h1', ctx({
      oldMeta: baseMeta({ title: 'Same', headings: [{ level: 1, text: 'Same' }] }),
      newMeta: baseMeta({ title: 'Same', headings: [{ level: 1, text: 'Same' }] }),
    }))).toHaveLength(0)
  })
})

// ============================================================
// CONTENT RULES
// ============================================================

describe('soft_404', () => {
  it('fires for soft 404 pages', () => {
    const results = runRule('soft_404', ctx({
      newMeta: baseMeta({ isSoft404: true }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire for normal pages', () => {
    expect(runRule('soft_404', ctx({
      newMeta: baseMeta({ isSoft404: false }),
    }))).toHaveLength(0)
  })
})

describe('thin_content', () => {
  it('fires when content drops below 200 words', () => {
    const results = runRule('thin_content', ctx({
      oldMeta: baseMeta({ wordCount: 500 }),
      newMeta: baseMeta({ wordCount: 50 }),
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire if was already thin', () => {
    expect(runRule('thin_content', ctx({
      oldMeta: baseMeta({ wordCount: 100 }),
      newMeta: baseMeta({ wordCount: 80 }),
    }))).toHaveLength(0)
  })
})

describe('content_removed', () => {
  it('fires when content drops >50%', () => {
    const results = runRule('content_removed', ctx({
      oldMeta: baseMeta({ wordCount: 1000 }),
      newMeta: baseMeta({ wordCount: 200 }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire for small drops', () => {
    expect(runRule('content_removed', ctx({
      oldMeta: baseMeta({ wordCount: 1000 }),
      newMeta: baseMeta({ wordCount: 800 }),
    }))).toHaveLength(0)
  })

  it('does not fire for very small pages', () => {
    expect(runRule('content_removed', ctx({
      oldMeta: baseMeta({ wordCount: 50 }),
      newMeta: baseMeta({ wordCount: 10 }),
    }))).toHaveLength(0)
  })
})

describe('word_count_changed', () => {
  it('fires for 30-50% change', () => {
    const results = runRule('word_count_changed', ctx({
      oldMeta: baseMeta({ wordCount: 1000 }),
      newMeta: baseMeta({ wordCount: 600 }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('info')
  })

  it('does not fire for small changes (<30%)', () => {
    expect(runRule('word_count_changed', ctx({
      oldMeta: baseMeta({ wordCount: 1000 }),
      newMeta: baseMeta({ wordCount: 900 }),
    }))).toHaveLength(0)
  })
})

// ============================================================
// STRUCTURED DATA RULES
// ============================================================

describe('structured_data_removed', () => {
  it('fires when JSON-LD types are removed', () => {
    const results = runRule('structured_data_removed', ctx({
      oldMeta: baseMeta({ jsonLdTypes: ['Product', 'BreadcrumbList'] }),
      newMeta: baseMeta({ jsonLdTypes: ['BreadcrumbList'] }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].message).toContain('Product')
  })

  it('does not fire when types are unchanged', () => {
    expect(runRule('structured_data_removed', ctx({
      oldMeta: baseMeta({ jsonLdTypes: ['Product'] }),
      newMeta: baseMeta({ jsonLdTypes: ['Product'] }),
    }))).toHaveLength(0)
  })
})

describe('structured_data_error', () => {
  it('fires for invalid JSON-LD', () => {
    const results = runRule('structured_data_error', ctx({
      newMeta: baseMeta({ jsonLdValid: false }),
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire for valid JSON-LD', () => {
    expect(runRule('structured_data_error', ctx({
      newMeta: baseMeta({ jsonLdValid: true }),
    }))).toHaveLength(0)
  })
})

// ============================================================
// TECHNICAL RULES
// ============================================================

describe('viewport_missing', () => {
  it('fires when viewport is removed', () => {
    const results = runRule('viewport_missing', ctx({
      oldMeta: baseMeta({ viewport: 'width=device-width' }),
      newMeta: baseMeta({ viewport: null }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire if viewport was never present', () => {
    expect(runRule('viewport_missing', ctx({
      oldMeta: baseMeta({ viewport: undefined as any }),
      newMeta: baseMeta({ viewport: null }),
    }))).toHaveLength(0)
  })
})

describe('charset_missing', () => {
  it('fires when charset is removed', () => {
    const results = runRule('charset_missing', ctx({
      oldMeta: baseMeta({ charset: 'utf-8' }),
      newMeta: baseMeta({ charset: null }),
    }))
    expect(results).toHaveLength(1)
  })
})

describe('meta_refresh_detected', () => {
  it('fires when meta refresh is present', () => {
    const results = runRule('meta_refresh_detected', ctx({
      newMeta: baseMeta({ hasMetaRefresh: true }),
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire without meta refresh', () => {
    expect(runRule('meta_refresh_detected', ctx({
      newMeta: baseMeta({ hasMetaRefresh: false }),
    }))).toHaveLength(0)
  })
})

describe('https_mixed_content', () => {
  it('fires when mixed content detected', () => {
    const results = runRule('https_mixed_content', ctx({
      newMeta: baseMeta({ hasMixedContent: true }),
    }))
    expect(results).toHaveLength(1)
  })
})

// ============================================================
// OPENGRAPH RULES
// ============================================================

describe('og_image_removed', () => {
  it('fires when og:image is removed', () => {
    const results = runRule('og_image_removed', ctx({
      oldMeta: baseMeta({ ogImage: 'https://example.com/img.jpg' }),
      newMeta: baseMeta({ ogImage: null }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
  })

  it('does not fire when og:image still exists', () => {
    expect(runRule('og_image_removed', ctx({
      oldMeta: baseMeta({ ogImage: 'https://example.com/old.jpg' }),
      newMeta: baseMeta({ ogImage: 'https://example.com/new.jpg' }),
    }))).toHaveLength(0)
  })
})

describe('og_title_removed', () => {
  it('fires when og:title is removed', () => {
    const results = runRule('og_title_removed', ctx({
      oldMeta: baseMeta({ ogTitle: 'Title' }),
      newMeta: baseMeta({ ogTitle: null }),
    }))
    expect(results).toHaveLength(1)
  })
})

// ============================================================
// I18N RULES
// ============================================================

describe('hreflang_removed', () => {
  it('fires when all hreflangs are removed', () => {
    const results = runRule('hreflang_removed', ctx({
      oldMeta: baseMeta({ hreflangs: [{ lang: 'fr', href: '/fr' }, { lang: 'en', href: '/en' }] }),
      newMeta: baseMeta({ hreflangs: [] }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire when hreflangs still exist', () => {
    expect(runRule('hreflang_removed', ctx({
      oldMeta: baseMeta({ hreflangs: [{ lang: 'fr', href: '/fr' }] }),
      newMeta: baseMeta({ hreflangs: [{ lang: 'fr', href: '/fr' }] }),
    }))).toHaveLength(0)
  })
})

describe('hreflang_changed', () => {
  it('fires when languages change', () => {
    const results = runRule('hreflang_changed', ctx({
      oldMeta: baseMeta({ hreflangs: [{ lang: 'fr', href: '/fr' }, { lang: 'en', href: '/en' }] }),
      newMeta: baseMeta({ hreflangs: [{ lang: 'fr', href: '/fr' }, { lang: 'de', href: '/de' }] }),
    }))
    expect(results).toHaveLength(1)
  })
})

describe('lang_attribute_missing', () => {
  it('fires when lang is removed', () => {
    const results = runRule('lang_attribute_missing', ctx({
      oldMeta: baseMeta({ lang: 'fr' }),
      newMeta: baseMeta({ lang: null }),
    }))
    expect(results).toHaveLength(1)
  })
})

describe('lang_attribute_changed', () => {
  it('fires when lang changes', () => {
    const results = runRule('lang_attribute_changed', ctx({
      oldMeta: baseMeta({ lang: 'fr' }),
      newMeta: baseMeta({ lang: 'en' }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].message).toContain('fr')
    expect(results[0].message).toContain('en')
  })
})

// ============================================================
// REDIRECT RULES
// ============================================================

describe('redirect_to_homepage', () => {
  it('fires when page redirects to homepage', () => {
    const results = runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/product/123',
      finalUrl: 'https://example.com/',
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire when no redirect', () => {
    expect(runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/page',
      finalUrl: 'https://example.com/page',
    }))).toHaveLength(0)
  })

  it('does not fire for non-homepage redirect', () => {
    expect(runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/old',
      finalUrl: 'https://example.com/new',
    }))).toHaveLength(0)
  })

  it('does not fire for trailing slash redirect (https://x.com → https://x.com/)', () => {
    expect(runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
    }))).toHaveLength(0)
  })

  it('does not fire when original URL is already the homepage', () => {
    expect(runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
    }))).toHaveLength(0)
  })

  it('does not fire for trailing slash on subpage', () => {
    expect(runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/page',
      finalUrl: 'https://example.com/page/',
    }))).toHaveLength(0)
  })

  it('still fires for real redirect from subpage to homepage', () => {
    const results = runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/deleted-product',
      finalUrl: 'https://example.com/',
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })
})

// ============================================================
// PRIORITY FILTER (runAllRules)
// ============================================================

describe('filterByPriority via runAllRules', () => {
  it('status_code_changed ≥ 400 suppresses other alerts', () => {
    const results = runAllRules(ctx({
      oldStatusCode: 200,
      newStatusCode: 503,
      oldMeta: baseMeta({ title: 'Old Title', description: 'Old desc', canonical: 'https://example.com/page', viewport: 'width=device-width', headings: [{ level: 1, text: 'Old H1' }], wordCount: 1000 }),
      newMeta: baseMeta({ title: null, description: null, canonical: null, viewport: null, headings: [], wordCount: 10 }),
    }))
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('status_code_changed')
  })

  it('status_code_changed < 400 does NOT suppress other alerts', () => {
    const results = runAllRules(ctx({
      oldStatusCode: 200,
      newStatusCode: 301,
      oldMeta: baseMeta({ canonical: 'https://example.com/old' }),
      newMeta: baseMeta({ canonical: 'https://example.com/new' }),
    }))
    const types = results.map(r => r.type)
    expect(types).toContain('status_code_changed')
    expect(types).toContain('canonical_changed')
  })

  it('redirect_to_homepage suppresses other alerts', () => {
    const results = runAllRules(ctx({
      pageUrl: 'https://example.com/product/123',
      finalUrl: 'https://example.com/',
      oldMeta: baseMeta({ title: 'Product', description: 'Desc', headings: [{ level: 1, text: 'Product' }] }),
      newMeta: baseMeta({ title: 'Homepage', description: 'Home desc', headings: [{ level: 1, text: 'Welcome' }] }),
    }))
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('redirect_to_homepage')
  })

  it('soft_404 suppresses other alerts', () => {
    const results = runAllRules(ctx({
      oldMeta: baseMeta({ wordCount: 500 }),
      newMeta: baseMeta({ isSoft404: true, wordCount: 20 }),
    }))
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('soft_404')
  })

  it('no root cause → all alerts pass through', () => {
    const results = runAllRules(ctx({
      oldMeta: baseMeta({ title: 'Old Title', canonical: 'https://example.com/old' }),
      newMeta: baseMeta({ title: 'New Title', canonical: 'https://example.com/new' }),
    }))
    const types = results.map(r => r.type)
    expect(types).toContain('meta_title_changed')
    expect(types).toContain('canonical_changed')
  })
})

// ============================================================
// GEO RULES — RECOMMENDATIONS
// ============================================================

describe('rec_llms_txt_missing', () => {
  it('fires when llms.txt is missing (homepage)', () => {
    const results = runRule('rec_llms_txt_missing', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { hasLlmsTxt: false, aiCrawlersBlocked: [], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('info')
  })

  it('does not fire when llms.txt exists', () => {
    const results = runRule('rec_llms_txt_missing', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { hasLlmsTxt: true, aiCrawlersBlocked: [], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire on non-root pages', () => {
    const results = runRule('rec_llms_txt_missing', ctx({
      pageUrl: 'https://example.com/about',
      siteContext: { hasLlmsTxt: false, aiCrawlersBlocked: [], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire without siteContext', () => {
    expect(runRule('rec_llms_txt_missing', ctx())).toHaveLength(0)
  })
})

describe('rec_ai_crawlers_blocked', () => {
  it('fires when AI crawlers are blocked (homepage)', () => {
    const results = runRule('rec_ai_crawlers_blocked', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { hasLlmsTxt: true, aiCrawlersBlocked: ['GPTBot', 'Anthropic-AI'], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
    expect(results[0].currentValue).toBe('GPTBot, Anthropic-AI')
  })

  it('does not fire when no crawlers blocked', () => {
    const results = runRule('rec_ai_crawlers_blocked', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { hasLlmsTxt: true, aiCrawlersBlocked: [], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_structured_data_incomplete', () => {
  it('fires when JSON-LD has no author/datePublished/publisher', () => {
    const results = runRule('rec_structured_data_incomplete', ctx({
      newMeta: baseMeta({ jsonLdTypes: ['Article'], jsonLdAuthor: null, jsonLdDatePublished: null, jsonLdPublisher: null }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('info')
  })

  it('does not fire when all fields present', () => {
    const results = runRule('rec_structured_data_incomplete', ctx({
      newMeta: baseMeta({ jsonLdTypes: ['Article'], jsonLdAuthor: 'John', jsonLdDatePublished: '2026-01-01', jsonLdPublisher: 'Seogard' }),
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire when no JSON-LD at all', () => {
    const results = runRule('rec_structured_data_incomplete', ctx({
      newMeta: baseMeta({ jsonLdTypes: [] }),
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_faq_schema_missing', () => {
  it('fires on content pages without FAQPage', () => {
    const results = runRule('rec_faq_schema_missing', ctx({
      newMeta: baseMeta({ wordCount: 500, hasFaqSchema: false }),
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire when FAQPage exists', () => {
    const results = runRule('rec_faq_schema_missing', ctx({
      newMeta: baseMeta({ wordCount: 500, hasFaqSchema: true }),
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire on thin pages', () => {
    const results = runRule('rec_faq_schema_missing', ctx({
      newMeta: baseMeta({ wordCount: 100, hasFaqSchema: false }),
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_citation_signals_missing', () => {
  it('fires when 2+ signals are missing', () => {
    const results = runRule('rec_citation_signals_missing', ctx({
      newMeta: baseMeta({ wordCount: 500, jsonLdAuthor: null, jsonLdDatePublished: null, externalLinkCount: 0 }),
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire when only 1 signal missing', () => {
    const results = runRule('rec_citation_signals_missing', ctx({
      newMeta: baseMeta({ wordCount: 500, jsonLdAuthor: 'John', jsonLdDatePublished: null, externalLinkCount: 3 }),
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire on thin pages', () => {
    const results = runRule('rec_citation_signals_missing', ctx({
      newMeta: baseMeta({ wordCount: 100, jsonLdAuthor: null, jsonLdDatePublished: null, externalLinkCount: 0 }),
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_content_structure_audit', () => {
  it('fires when no H2 and no lists', () => {
    const results = runRule('rec_content_structure_audit', ctx({
      newMeta: baseMeta({ wordCount: 500, headings: [{ level: 1, text: 'Title' }], hasLists: false }),
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire when H2 and lists exist', () => {
    const results = runRule('rec_content_structure_audit', ctx({
      newMeta: baseMeta({ wordCount: 500, headings: [{ level: 1, text: 'Title' }, { level: 2, text: 'Section' }], hasLists: true }),
    }))
    expect(results).toHaveLength(0)
  })
})

// ============================================================
// GEO RULES — MONITORING (REGRESSION)
// ============================================================

describe('llms_txt_removed', () => {
  it('fires when llms.txt is removed', () => {
    const results = runRule('llms_txt_removed', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { hasLlmsTxt: false, oldHasLlmsTxt: true, aiCrawlersBlocked: [], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire when llms.txt still exists', () => {
    const results = runRule('llms_txt_removed', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { hasLlmsTxt: true, oldHasLlmsTxt: true, aiCrawlersBlocked: [], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire when llms.txt never existed', () => {
    const results = runRule('llms_txt_removed', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { hasLlmsTxt: false, oldHasLlmsTxt: false, aiCrawlersBlocked: [], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire on non-root pages', () => {
    const results = runRule('llms_txt_removed', ctx({
      pageUrl: 'https://example.com/about',
      siteContext: { hasLlmsTxt: false, oldHasLlmsTxt: true, aiCrawlersBlocked: [], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('ai_crawlers_blocked_changed', () => {
  it('fires when new AI crawlers are blocked', () => {
    const results = runRule('ai_crawlers_blocked_changed', ctx({
      pageUrl: 'https://example.com/',
      siteContext: {
        hasLlmsTxt: true,
        aiCrawlersBlocked: ['GPTBot', 'Anthropic-AI'],
        oldAiCrawlersBlocked: [],
        robotsTxtRaw: null,
      },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
  })

  it('does not fire when same crawlers blocked as before', () => {
    const results = runRule('ai_crawlers_blocked_changed', ctx({
      pageUrl: 'https://example.com/',
      siteContext: {
        hasLlmsTxt: true,
        aiCrawlersBlocked: ['GPTBot'],
        oldAiCrawlersBlocked: ['GPTBot'],
        robotsTxtRaw: null,
      },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire without previous data', () => {
    const results = runRule('ai_crawlers_blocked_changed', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { hasLlmsTxt: true, aiCrawlersBlocked: ['GPTBot'], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('faq_schema_removed', () => {
  it('fires when FAQPage is removed', () => {
    const results = runRule('faq_schema_removed', ctx({
      oldMeta: baseMeta({ hasFaqSchema: true }),
      newMeta: baseMeta({ hasFaqSchema: false }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
  })

  it('does not fire when FAQPage still exists', () => {
    const results = runRule('faq_schema_removed', ctx({
      oldMeta: baseMeta({ hasFaqSchema: true }),
      newMeta: baseMeta({ hasFaqSchema: true }),
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire on first crawl', () => {
    const results = runRule('faq_schema_removed', ctx({
      oldMeta: null,
      newMeta: baseMeta({ hasFaqSchema: false }),
    }))
    expect(results).toHaveLength(0)
  })
})

describe('structured_data_author_removed', () => {
  it('fires when author is removed from JSON-LD', () => {
    const results = runRule('structured_data_author_removed', ctx({
      oldMeta: baseMeta({ jsonLdAuthor: 'John Doe' }),
      newMeta: baseMeta({ jsonLdAuthor: null }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire when author still exists', () => {
    const results = runRule('structured_data_author_removed', ctx({
      oldMeta: baseMeta({ jsonLdAuthor: 'John Doe' }),
      newMeta: baseMeta({ jsonLdAuthor: 'Jane Doe' }),
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire when author never existed', () => {
    const results = runRule('structured_data_author_removed', ctx({
      oldMeta: baseMeta({ jsonLdAuthor: null }),
      newMeta: baseMeta({ jsonLdAuthor: null }),
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire on first crawl', () => {
    const results = runRule('structured_data_author_removed', ctx({
      oldMeta: null,
      newMeta: baseMeta({ jsonLdAuthor: null }),
    }))
    expect(results).toHaveLength(0)
  })
})
