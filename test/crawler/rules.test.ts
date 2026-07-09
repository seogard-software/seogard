import { describe, it, expect } from 'vitest'
import type { RuleContext } from '../../crawler/rules/engine'
import { runRule, runAllRules, filterByPriority } from '../../crawler/rules/engine'
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
import '../../crawler/rules/recommendations'
import '../../crawler/rules/geo'

// --- Test helpers ---

function baseMeta(overrides: Partial<PageMeta> = {}): PageMeta {
  return {
    title: 'Test Page Title Here',
    description: 'A test description that is long enough to be valid and useful for testing.',
    canonical: 'https://example.com/page',
    robots: null,
    robotsGooglebot: null,
    xRobotsTag: null,
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
    redirectTarget: null,
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

/** Simule d'anciennes données : les champs robotsGooglebot/xRobotsTag n'existaient pas encore en base. */
function legacyMeta(overrides: Partial<PageMeta> = {}): PageMeta {
  const m = baseMeta(overrides) as Partial<PageMeta>
  delete m.robotsGooglebot
  delete m.xRobotsTag
  return m as PageMeta
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
    expect(results[0].severity).toBe('warning')
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

  // noindex via en-tête HTTP X-Robots-Tag + balise meta googlebot
  it('fire quand X-Robots-Tag: noindex est ajouté (ni meta ni header avant)', () => {
    const r = runRule('noindex_added', ctx({
      oldMeta: baseMeta({ robots: null, xRobotsTag: null }),
      newMeta: baseMeta({ robots: null, xRobotsTag: 'noindex' }),
    }))
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('critical')
  })

  it('X-Robots-Tag ciblé "googlebot: noindex" → fire', () => {
    expect(runRule('noindex_added', ctx({
      oldMeta: baseMeta({ xRobotsTag: null }),
      newMeta: baseMeta({ xRobotsTag: 'googlebot: noindex' }),
    }))).toHaveLength(1)
  })

  it('balise <meta googlebot> noindex → fire', () => {
    expect(runRule('noindex_added', ctx({
      oldMeta: baseMeta({ robotsGooglebot: null }),
      newMeta: baseMeta({ robotsGooglebot: 'noindex' }),
    }))).toHaveLength(1)
  })

  it('meta + header ajoutés ensemble → une seule alerte', () => {
    expect(runRule('noindex_added', ctx({
      oldMeta: baseMeta({ robots: null, xRobotsTag: null }),
      newMeta: baseMeta({ robots: 'noindex', xRobotsTag: 'noindex' }),
    }))).toHaveLength(1)
  })

  it('header ajouté alors que meta robots était déjà noindex → pas de nouvelle alerte', () => {
    expect(runRule('noindex_added', ctx({
      oldMeta: baseMeta({ robots: 'noindex', xRobotsTag: null }),
      newMeta: baseMeta({ robots: 'noindex', xRobotsTag: 'noindex' }),
    }))).toHaveLength(0)
  })

  it('header retiré → pas de nouvelle alerte', () => {
    expect(runRule('noindex_added', ctx({
      oldMeta: baseMeta({ xRobotsTag: 'noindex' }),
      newMeta: baseMeta({ xRobotsTag: null }),
    }))).toHaveLength(0)
  })

  it('migration : legacy (header non suivi) + noindex header-only → pas d\'alerte (baseline)', () => {
    expect(runRule('noindex_added', ctx({
      oldMeta: legacyMeta({ robots: null }),
      newMeta: baseMeta({ robots: null, xRobotsTag: 'noindex' }),
    }))).toHaveLength(0)
  })

  it('migration : legacy + noindex via meta robots → alerte (meta robots toujours suivi)', () => {
    expect(runRule('noindex_added', ctx({
      oldMeta: legacyMeta({ robots: 'index' }),
      newMeta: baseMeta({ robots: 'noindex' }),
    }))).toHaveLength(1)
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

// La cible de redirection vient désormais de newMeta.redirectTarget (le fetcher en `manual` la
// pose pour les redirections significatives ; les canoniques bénignes sont suivies → redirectTarget null).
describe('redirect_to_homepage', () => {
  it('fires when page redirects to homepage', () => {
    const results = runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/product/123',
      newMeta: baseMeta({ redirectTarget: 'https://example.com/' }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does not fire when no redirect (redirectTarget null)', () => {
    expect(runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/page',
      newMeta: baseMeta({ redirectTarget: null }),
    }))).toHaveLength(0)
  })

  it('does not fire for non-homepage redirect', () => {
    expect(runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/old',
      newMeta: baseMeta({ redirectTarget: 'https://example.com/new' }),
    }))).toHaveLength(0)
  })

  it('does not fire for benign canonical (suivie par le fetcher → redirectTarget null)', () => {
    expect(runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com',
      newMeta: baseMeta({ redirectTarget: null }),
    }))).toHaveLength(0)
  })

  it('does not fire when original URL is already the homepage', () => {
    expect(runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/',
      newMeta: baseMeta({ redirectTarget: 'https://example.com/' }),
    }))).toHaveLength(0)
  })

  it('still fires for real redirect from subpage to homepage', () => {
    const results = runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/deleted-product',
      newMeta: baseMeta({ redirectTarget: 'https://example.com/' }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('critical')
  })

  it('does NOT re-fire when the page was already redirecting (transition only — résolu puis recrawl ne recrée pas l alerte)', () => {
    expect(runRule('redirect_to_homepage', ctx({
      pageUrl: 'https://example.com/deleted-product',
      oldStatusCode: 301,
      newMeta: baseMeta({ redirectTarget: 'https://example.com/' }),
    }))).toHaveLength(0)
  })
})

describe('page_redirected', () => {
  it('fires when a 200 page now redirects elsewhere (cross-path)', () => {
    const results = runRule('page_redirected', ctx({
      pageUrl: 'https://example.com/old-product',
      oldMeta: baseMeta(),
      newMeta: baseMeta({ redirectTarget: 'https://example.com/new-product' }),
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
    expect(results[0].currentValue).toBe('https://example.com/new-product')
  })

  it('does not fire on first crawl (no baseline)', () => {
    expect(runRule('page_redirected', ctx({
      pageUrl: 'https://example.com/old-product',
      oldMeta: null,
      newMeta: baseMeta({ redirectTarget: 'https://example.com/new-product' }),
    }))).toHaveLength(0)
  })

  it('does not fire when not redirecting (redirectTarget null)', () => {
    expect(runRule('page_redirected', ctx({
      oldMeta: baseMeta(),
      newMeta: baseMeta({ redirectTarget: null }),
    }))).toHaveLength(0)
  })

  it('does not fire when target is homepage (→ redirect_to_homepage)', () => {
    expect(runRule('page_redirected', ctx({
      pageUrl: 'https://example.com/old-product',
      oldMeta: baseMeta(),
      newMeta: baseMeta({ redirectTarget: 'https://example.com/' }),
    }))).toHaveLength(0)
  })

  it('does NOT re-fire when the page was already redirecting (transition only — résolu puis recrawl ne recrée pas l alerte)', () => {
    expect(runRule('page_redirected', ctx({
      pageUrl: 'https://example.com/old-product',
      oldMeta: baseMeta(),
      oldStatusCode: 301,
      newMeta: baseMeta({ redirectTarget: 'https://example.com/new-product' }),
    }))).toHaveLength(0)
  })

  it('fires when transitioning from 200 to redirect (oldStatusCode 200)', () => {
    expect(runRule('page_redirected', ctx({
      pageUrl: 'https://example.com/old-product',
      oldMeta: baseMeta(),
      oldStatusCode: 200,
      newMeta: baseMeta({ redirectTarget: 'https://example.com/new-product' }),
    }))).toHaveLength(1)
  })
})

describe('js_redirect_detected (redirection JavaScript, phase CSR)', () => {
  it('fires when the rendered URL diverges cross-path from the requested URL', () => {
    const r = runRule('js_redirect_detected', ctx({
      pageUrl: 'https://example.com/a',
      renderedUrl: 'https://example.com/b',
    }))
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('warning')
    expect(r[0].currentValue).toBe('https://example.com/b')
  })

  it('does not fire in SSR phase (renderedUrl null)', () => {
    expect(runRule('js_redirect_detected', ctx({
      pageUrl: 'https://example.com/a',
      renderedUrl: null,
    }))).toHaveLength(0)
  })

  it('does not fire on benign canonical (trailing slash)', () => {
    expect(runRule('js_redirect_detected', ctx({
      pageUrl: 'https://example.com/a',
      renderedUrl: 'https://example.com/a/',
    }))).toHaveLength(0)
  })

  it('does not fire on benign canonical (http→https + www)', () => {
    expect(runRule('js_redirect_detected', ctx({
      pageUrl: 'http://example.com/a',
      renderedUrl: 'https://www.example.com/a',
    }))).toHaveLength(0)
  })

  it('does not fire when rendered URL equals requested', () => {
    expect(runRule('js_redirect_detected', ctx({
      pageUrl: 'https://example.com/a',
      renderedUrl: 'https://example.com/a',
    }))).toHaveLength(0)
  })

  it('does not fire when only a query string is added (même page : ?ref/?utm via script)', () => {
    expect(runRule('js_redirect_detected', ctx({
      pageUrl: 'https://example.com/a',
      renderedUrl: 'https://example.com/a?ref=1&utm_source=x',
    }))).toHaveLength(0)
  })

  it('does not fire when JS redirects to a WAF challenge URL (cdn-cgi/captcha)', () => {
    expect(runRule('js_redirect_detected', ctx({
      pageUrl: 'https://example.com/a',
      renderedUrl: 'https://example.com/cdn-cgi/challenge-platform/x',
    }))).toHaveLength(0)
    expect(runRule('js_redirect_detected', ctx({
      pageUrl: 'https://example.com/a',
      renderedUrl: 'https://geo.captcha-delivery.com/captcha/',
    }))).toHaveLength(0)
  })

  it('fires for a real JS redirect to a SMALL legit page (pas étouffé par une heuristique de taille)', () => {
    // Régression : isCsrBlocked aurait fait taire ça (<2000o). isRedirectToWaf, non.
    const r = runRule('js_redirect_detected', ctx({
      pageUrl: 'https://example.com/old',
      renderedUrl: 'https://example.com/merci',
      renderedMeta: { title: 'Merci' },
      csrContentLength: 300,
    }))
    expect(r).toHaveLength(1)
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
      oldMeta: baseMeta({ title: 'Product', description: 'Desc', headings: [{ level: 1, text: 'Product' }] }),
      newMeta: baseMeta({ title: null, description: null, headings: [], redirectTarget: 'https://example.com/' }),
    }))
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('redirect_to_homepage')
  })

  it('page_redirected (cross-path) suppresses content/status noise', () => {
    const results = runAllRules(ctx({
      pageUrl: 'https://example.com/old-product',
      oldStatusCode: 200,
      newStatusCode: 301,
      oldMeta: baseMeta({ title: 'Product', description: 'Desc', headings: [{ level: 1, text: 'Product' }] }),
      // Corps vide d'une redirection : metas/contenu disparus + status 200→301
      newMeta: baseMeta({ title: null, description: null, headings: [], wordCount: 0, redirectTarget: 'https://example.com/new-product' }),
    }))
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('page_redirected')
  })

  it('js_redirect_detected supprime le bruit SSR/CSR (cause racine)', () => {
    const results = filterByPriority(
      [
        { type: 'js_redirect_detected', severity: 'warning', message: '', previousValue: null, currentValue: null },
        { type: 'ssr_content_mismatch', severity: 'critical', message: '', previousValue: null, currentValue: null },
      ],
      ctx({ renderedUrl: 'https://example.com/b' }),
    )
    expect(results.map(r => r.type)).toEqual(['js_redirect_detected'])
  })

  it('3xx sans Location (isRedirected mais pas de page_redirected) ne garde que status_code_changed', () => {
    const results = filterByPriority(
      [
        { type: 'status_code_changed', severity: 'warning', message: '', previousValue: '200', currentValue: '307' },
        { type: 'meta_title_missing', severity: 'critical', message: '', previousValue: null, currentValue: null },
      ],
      ctx({ newStatusCode: 307, newMeta: baseMeta({ isRedirected: true, redirectTarget: null }) }),
    )
    expect(results.map(r => r.type)).toEqual(['status_code_changed'])
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
  it('does not fire in SSR phase (renderedMeta null)', () => {
    const results = runRule('rec_structured_data_incomplete', ctx({
      newMeta: baseMeta({ jsonLdTypes: ['Article'], jsonLdAuthor: null }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when JSON-LD has no author/datePublished/publisher in CSR', () => {
    const results = runRule('rec_structured_data_incomplete', ctx({
      renderedMeta: { jsonLdTypes: ['Article'], jsonLdAuthor: null, jsonLdDatePublished: null, jsonLdPublisher: null },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('info')
  })

  it('does not fire when all fields present in CSR', () => {
    const results = runRule('rec_structured_data_incomplete', ctx({
      renderedMeta: { jsonLdTypes: ['Article'], jsonLdAuthor: 'John', jsonLdDatePublished: '2026-01-01', jsonLdPublisher: 'Seogard' },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire when no JSON-LD at all', () => {
    const results = runRule('rec_structured_data_incomplete', ctx({
      renderedMeta: { jsonLdTypes: [] },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_faq_schema_missing', () => {
  it('does not fire in SSR phase', () => {
    const results = runRule('rec_faq_schema_missing', ctx({
      newMeta: baseMeta({ wordCount: 500, hasFaqSchema: false }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires on content pages without FAQPage in CSR', () => {
    const results = runRule('rec_faq_schema_missing', ctx({
      renderedMeta: { hasFaqSchema: false, wordCount: 500 },
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire when FAQPage exists in CSR', () => {
    const results = runRule('rec_faq_schema_missing', ctx({
      renderedMeta: { hasFaqSchema: true, wordCount: 500 },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire on thin pages', () => {
    const results = runRule('rec_faq_schema_missing', ctx({
      renderedMeta: { hasFaqSchema: false, wordCount: 100 },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_citation_signals_missing', () => {
  it('does not fire in SSR phase', () => {
    const results = runRule('rec_citation_signals_missing', ctx({
      newMeta: baseMeta({ wordCount: 500, jsonLdAuthor: null }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when 2+ signals are missing in CSR', () => {
    const results = runRule('rec_citation_signals_missing', ctx({
      renderedMeta: { jsonLdTypes: ['Article'], jsonLdAuthor: null, jsonLdDatePublished: null, externalLinkCount: 0, wordCount: 500 },
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire when only 1 signal missing in CSR', () => {
    const results = runRule('rec_citation_signals_missing', ctx({
      renderedMeta: { jsonLdTypes: ['Article'], jsonLdAuthor: 'John', jsonLdDatePublished: null, externalLinkCount: 3, wordCount: 500 },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire on thin pages', () => {
    const results = runRule('rec_citation_signals_missing', ctx({
      renderedMeta: { jsonLdTypes: ['Article'], jsonLdAuthor: null, jsonLdDatePublished: null, externalLinkCount: 0, wordCount: 100 },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_content_structure_audit', () => {
  it('does not fire in SSR phase', () => {
    const results = runRule('rec_content_structure_audit', ctx({
      newMeta: baseMeta({ wordCount: 500, headings: [], hasLists: false }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when no H2 and no lists in CSR', () => {
    const results = runRule('rec_content_structure_audit', ctx({
      renderedMeta: { headings: [{ level: 1, text: 'Title' }], hasLists: false, wordCount: 500 },
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire when H2 and lists exist in CSR', () => {
    const results = runRule('rec_content_structure_audit', ctx({
      renderedMeta: { headings: [{ level: 1, text: 'Title' }, { level: 2, text: 'Section' }], hasLists: true, wordCount: 500 },
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
    expect(results[0].severity).toBe('info')
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

// Ancre des règles site-level sur l'URL racine ENREGISTRÉE du site (siteRootUrl),
// pas seulement pathname '/'. Couvre les sites servis sous un chemin (ex. /fr/).
describe('site-level anchor (siteRootUrl)', () => {
  it('fire sur la home servie sous un chemin (/fr/) quand elle matche siteRootUrl', () => {
    const results = runRule('llms_txt_removed', ctx({
      pageUrl: 'https://example.com/fr/',
      siteContext: { hasLlmsTxt: false, oldHasLlmsTxt: true, aiCrawlersBlocked: [], robotsTxtRaw: null, siteRootUrl: 'https://example.com/fr/' },
    }))
    expect(results).toHaveLength(1)
  })

  it('ne fire PAS sur une page interne même avec siteRootUrl défini', () => {
    const results = runRule('llms_txt_removed', ctx({
      pageUrl: 'https://example.com/fr/blog',
      siteContext: { hasLlmsTxt: false, oldHasLlmsTxt: true, aiCrawlersBlocked: [], robotsTxtRaw: null, siteRootUrl: 'https://example.com/fr/' },
    }))
    expect(results).toHaveLength(0)
  })

  it('match insensible au slash final (site.url sans slash, page avec)', () => {
    const results = runRule('llms_txt_removed', ctx({
      pageUrl: 'https://example.com/fr/',
      siteContext: { hasLlmsTxt: false, oldHasLlmsTxt: true, aiCrawlersBlocked: [], robotsTxtRaw: null, siteRootUrl: 'https://example.com/fr' },
    }))
    expect(results).toHaveLength(1)
  })

  it('repli sur pathname / quand siteRootUrl est absent (rétro-compat)', () => {
    const results = runRule('llms_txt_removed', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { hasLlmsTxt: false, oldHasLlmsTxt: true, aiCrawlersBlocked: [], robotsTxtRaw: null },
    }))
    expect(results).toHaveLength(1)
  })

  it('ai_crawlers_blocked_changed fire aussi sur l\'ancre /fr/', () => {
    const results = runRule('ai_crawlers_blocked_changed', ctx({
      pageUrl: 'https://example.com/fr/',
      siteContext: { hasLlmsTxt: true, aiCrawlersBlocked: ['GPTBot'], oldAiCrawlersBlocked: [], robotsTxtRaw: null, siteRootUrl: 'https://example.com/fr/' },
    }))
    expect(results).toHaveLength(1)
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

describe('robots_blocks_googlebot', () => {
  const base = { hasLlmsTxt: true, aiCrawlersBlocked: [], robotsTxtRaw: null }

  it('fire quand un Disallow couvrant Googlebot apparaît (auparavant rien)', () => {
    const r = runRule('robots_blocks_googlebot', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { ...base, oldGooglebotBlockedPaths: [], googlebotBlockedPaths: ['/'] },
    }))
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('critical')
    expect(r[0].message).toContain('/')
  })

  it('ne liste que les chemins NOUVELLEMENT bloqués', () => {
    const r = runRule('robots_blocks_googlebot', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { ...base, oldGooglebotBlockedPaths: ['/old'], googlebotBlockedPaths: ['/old', '/new'] },
    }))
    expect(r).toHaveLength(1)
    expect(r[0].message).toContain('/new')
    expect(r[0].message).not.toContain('/old')
  })

  it('pas de baseline (1er crawl avec ce suivi) → pas de fire', () => {
    expect(runRule('robots_blocks_googlebot', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { ...base, googlebotBlockedPaths: ['/'] }, // oldGooglebotBlockedPaths undefined
    }))).toHaveLength(0)
  })

  it('aucun changement (mêmes chemins) → pas de fire', () => {
    expect(runRule('robots_blocks_googlebot', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { ...base, oldGooglebotBlockedPaths: ['/admin'], googlebotBlockedPaths: ['/admin'] },
    }))).toHaveLength(0)
  })

  it('blocage retiré → pas de fire', () => {
    expect(runRule('robots_blocks_googlebot', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { ...base, oldGooglebotBlockedPaths: ['/admin'], googlebotBlockedPaths: [] },
    }))).toHaveLength(0)
  })

  it('blocage IA uniquement (Googlebot non concerné) → pas de fire', () => {
    expect(runRule('robots_blocks_googlebot', ctx({
      pageUrl: 'https://example.com/',
      siteContext: { ...base, aiCrawlersBlocked: ['GPTBot'], oldGooglebotBlockedPaths: [], googlebotBlockedPaths: [] },
    }))).toHaveLength(0)
  })

  it('ne fire pas sur une page non-racine', () => {
    expect(runRule('robots_blocks_googlebot', ctx({
      pageUrl: 'https://example.com/blog',
      siteContext: { ...base, oldGooglebotBlockedPaths: [], googlebotBlockedPaths: ['/'] },
    }))).toHaveLength(0)
  })

  it('fire sur l\'ancre /fr/ via siteRootUrl', () => {
    expect(runRule('robots_blocks_googlebot', ctx({
      pageUrl: 'https://example.com/fr/',
      siteContext: { ...base, siteRootUrl: 'https://example.com/fr/', oldGooglebotBlockedPaths: [], googlebotBlockedPaths: ['/fr/private'] },
    }))).toHaveLength(1)
  })
})

describe('faq_schema_removed', () => {
  it('fires when FAQPage is removed', () => {
    const results = runRule('faq_schema_removed', ctx({
      oldMeta: baseMeta({ hasFaqSchema: true }),
      newMeta: baseMeta({ hasFaqSchema: false }),
    }))
    expect(results).toHaveLength(1)
    // info (et non warning) : Google n'affiche plus de rich result FAQ → impact direct faible.
    expect(results[0].severity).toBe('info')
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
    expect(results[0].severity).toBe('warning')
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

// ============================================================
// rec_h1_missing_audit (CSR-based) and rec_h1_missing_in_ssr
// ============================================================

describe('rec_h1_missing_audit', () => {
  it('does not fire in SSR phase (renderedMeta is null)', () => {
    const results = runRule('rec_h1_missing_audit', ctx({
      newMeta: baseMeta({ headings: [] }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when CSR has no H1 with text', () => {
    const results = runRule('rec_h1_missing_audit', ctx({
      newMeta: baseMeta({ headings: [] }),
      renderedMeta: { headings: [] },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
  })

  it('fires when CSR has only empty H1s', () => {
    const results = runRule('rec_h1_missing_audit', ctx({
      newMeta: baseMeta({ headings: [{ level: 1, text: '' }] }),
      renderedMeta: { headings: [{ level: 1, text: '' }] },
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire when CSR has at least one H1 with text', () => {
    const results = runRule('rec_h1_missing_audit', ctx({
      newMeta: baseMeta({ headings: [] }),
      renderedMeta: { headings: [{ level: 1, text: 'Hello' }] },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_h1_missing_in_ssr', () => {
  it('does not fire in SSR-only phase (renderedMeta null)', () => {
    const results = runRule('rec_h1_missing_in_ssr', ctx({
      newMeta: baseMeta({ headings: [] }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when SSR has empty H1 but CSR has filled H1', () => {
    const results = runRule('rec_h1_missing_in_ssr', ctx({
      newMeta: baseMeta({ headings: [{ level: 1, text: '' }] }),
      renderedMeta: { headings: [{ level: 1, text: 'Hydrated H1' }] },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
    expect(results[0].currentValue).toBe('Hydrated H1')
  })

  it('fires when SSR has no H1 but CSR has filled H1', () => {
    const results = runRule('rec_h1_missing_in_ssr', ctx({
      newMeta: baseMeta({ headings: [] }),
      renderedMeta: { headings: [{ level: 1, text: 'Injected by JS' }] },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].currentValue).toBe('Injected by JS')
  })

  it('does not fire when SSR already has filled H1', () => {
    const results = runRule('rec_h1_missing_in_ssr', ctx({
      newMeta: baseMeta({ headings: [{ level: 1, text: 'SSR H1' }] }),
      renderedMeta: { headings: [{ level: 1, text: 'SSR H1' }] },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire when both SSR and CSR are empty (rec_h1_missing_audit handles this)', () => {
    const results = runRule('rec_h1_missing_in_ssr', ctx({
      newMeta: baseMeta({ headings: [] }),
      renderedMeta: { headings: [] },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_content_missing_in_ssr', () => {
  // Bytes non catastrophiques (ratio 0,4) + CSR > 2000o (pas anti-bot) → on est dans la bande intermédiaire.
  const okBytes = { ssrContentLength: 2000, csrContentLength: 5000 }

  it('fire quand >50% du texte n\'est que dans le rendu JS (info, message en mots absolus)', () => {
    const r = runRule('rec_content_missing_in_ssr', ctx({
      ...okBytes,
      newMeta: baseMeta({ wordCount: 300 }),
      renderedMeta: { wordCount: 760 },
    }))
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('warning')
    expect(r[0].message).toContain('460 of 760 words')
    expect(r[0].message).not.toMatch(/%/) // pas de pourcentage présenté comme une mesure
  })

  it('pas de fire si l\'essentiel du texte est dans le HTML brut (ratio ≥ 0,5)', () => {
    expect(runRule('rec_content_missing_in_ssr', ctx({
      ...okBytes, newMeta: baseMeta({ wordCount: 500 }), renderedMeta: { wordCount: 760 },
    }))).toHaveLength(0)
  })

  it('pas de fire si moins de 300 mots rendus', () => {
    expect(runRule('rec_content_missing_in_ssr', ctx({
      ...okBytes, newMeta: baseMeta({ wordCount: 50 }), renderedMeta: { wordCount: 250 },
    }))).toHaveLength(0)
  })

  it('pas de fire si l\'écart absolu < 200 mots', () => {
    expect(runRule('rec_content_missing_in_ssr', ctx({
      ...okBytes, newMeta: baseMeta({ wordCount: 130 }), renderedMeta: { wordCount: 300 },
    }))).toHaveLength(0)
  })

  it('pas de fire en phase SSR (renderedMeta null)', () => {
    expect(runRule('rec_content_missing_in_ssr', ctx({
      ...okBytes, newMeta: baseMeta({ wordCount: 100 }), renderedMeta: null,
    }))).toHaveLength(0)
  })

  it('pas de fire si anti-bot (CSR trop court) ou erreur serveur', () => {
    expect(runRule('rec_content_missing_in_ssr', ctx({
      ssrContentLength: 500, csrContentLength: 1000, // < 2000 → isCsrBlocked
      newMeta: baseMeta({ wordCount: 100 }), renderedMeta: { wordCount: 760 },
    }))).toHaveLength(0)
    expect(runRule('rec_content_missing_in_ssr', ctx({
      ...okBytes, newStatusCode: 503, newMeta: baseMeta({ wordCount: 100 }), renderedMeta: { wordCount: 760 },
    }))).toHaveLength(0)
  })

  // ANTI-DOUBLON : une page catastrophique (octets < 10%) ne déclenche QUE ssr_content_mismatch,
  // jamais aussi rec_content_missing_in_ssr (pas de "deux mismatch" sur la même page).
  it('ne fire PAS sur une page catastrophique (octets < 10%) — laissée à ssr_content_mismatch', () => {
    const catastrophic = ctx({
      ssrContentLength: 400, csrContentLength: 5000, // ratio octets 0,08 < 0,10
      newMeta: baseMeta({ wordCount: 30 }),
      renderedMeta: { wordCount: 760 },
    })
    expect(runRule('rec_content_missing_in_ssr', catastrophic)).toHaveLength(0)
    // ...et c'est bien ssr_content_mismatch (critical) qui parle, lui seul :
    expect(runRule('ssr_content_mismatch', catastrophic)).toHaveLength(1)
  })
})

describe('rec_title_missing_in_ssr', () => {
  const okBytes = { ssrContentLength: 2000, csrContentLength: 5000 }

  it('fire quand le title est absent du HTML brut mais rempli en CSR (warning)', () => {
    const r = runRule('rec_title_missing_in_ssr', ctx({
      ...okBytes,
      oldMeta: null, // structurel, pas une régression
      newMeta: baseMeta({ title: null }),
      renderedMeta: { title: 'Titre injecté par JS' },
    }))
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('warning')
    expect(r[0].currentValue).toBe('Titre injecté par JS')
  })

  it('pas de fire si le title est déjà dans le HTML brut', () => {
    expect(runRule('rec_title_missing_in_ssr', ctx({
      ...okBytes, newMeta: baseMeta({ title: 'Présent en SSR' }), renderedMeta: { title: 'Présent en SSR' },
    }))).toHaveLength(0)
  })

  it('pas de fire si le title manque aussi en CSR', () => {
    expect(runRule('rec_title_missing_in_ssr', ctx({
      ...okBytes, newMeta: baseMeta({ title: null }), renderedMeta: { title: null },
    }))).toHaveLength(0)
  })

  // ANTI-DOUBLON : un title qui EXISTAIT et disparaît du HTML brut est une régression
  // (meta_title_missing, critical + email) → la reco ne doit PAS doublonner.
  it('ne fire PAS si le title existait avant (laissé à meta_title_missing)', () => {
    const lost = ctx({
      ...okBytes,
      oldMeta: baseMeta({ title: 'Ancien titre' }),
      newMeta: baseMeta({ title: null }),
      renderedMeta: { title: 'Toujours rendu par JS' },
    })
    expect(runRule('rec_title_missing_in_ssr', lost)).toHaveLength(0)
    expect(runRule('meta_title_missing', lost)).toHaveLength(1)
  })

  it('pas de fire en phase SSR (renderedMeta null)', () => {
    expect(runRule('rec_title_missing_in_ssr', ctx({
      ...okBytes, newMeta: baseMeta({ title: null }), renderedMeta: null,
    }))).toHaveLength(0)
  })

  it('pas de fire si anti-bot (CSR trop court) ou erreur serveur', () => {
    expect(runRule('rec_title_missing_in_ssr', ctx({
      ssrContentLength: 500, csrContentLength: 1000,
      newMeta: baseMeta({ title: null }), renderedMeta: { title: 'X' },
    }))).toHaveLength(0)
    expect(runRule('rec_title_missing_in_ssr', ctx({
      ...okBytes, newStatusCode: 503, newMeta: baseMeta({ title: null }), renderedMeta: { title: 'X' },
    }))).toHaveLength(0)
  })
})

describe('rec_description_missing_in_ssr', () => {
  const okBytes = { ssrContentLength: 2000, csrContentLength: 5000 }

  it('fire quand la meta description est absente du HTML brut mais rendue en CSR (info)', () => {
    const r = runRule('rec_description_missing_in_ssr', ctx({
      ...okBytes,
      oldMeta: null,
      newMeta: baseMeta({ description: null }),
      renderedMeta: { description: 'Description injectée par JS' },
    }))
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('info')
    expect(r[0].currentValue).toBe('Description injectée par JS')
  })

  it('pas de fire si la description est déjà dans le HTML brut', () => {
    expect(runRule('rec_description_missing_in_ssr', ctx({
      ...okBytes, newMeta: baseMeta({ description: 'Présente en SSR' }), renderedMeta: { description: 'Présente en SSR' },
    }))).toHaveLength(0)
  })

  // ANTI-DOUBLON : disparition d'une description existante = meta_description_missing (warning).
  it('ne fire PAS si la description existait avant (laissée à meta_description_missing)', () => {
    const lost = ctx({
      ...okBytes,
      oldMeta: baseMeta({ description: 'Ancienne description' }),
      newMeta: baseMeta({ description: null }),
      renderedMeta: { description: 'Toujours rendue par JS' },
    })
    expect(runRule('rec_description_missing_in_ssr', lost)).toHaveLength(0)
    expect(runRule('meta_description_missing', lost)).toHaveLength(1)
  })

  it('pas de fire en phase SSR (renderedMeta null)', () => {
    expect(runRule('rec_description_missing_in_ssr', ctx({
      ...okBytes, newMeta: baseMeta({ description: null }), renderedMeta: null,
    }))).toHaveLength(0)
  })
})

// ============================================================
// rec_internal_links_audit (CSR-based) and rec_internal_links_missing_in_ssr
// ============================================================

describe('rec_internal_links_audit', () => {
  it('does not fire in SSR phase (renderedMeta is null)', () => {
    const results = runRule('rec_internal_links_audit', ctx({
      newMeta: baseMeta({ internalLinkCount: 0 }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when CSR has < 3 internal links', () => {
    const results = runRule('rec_internal_links_audit', ctx({
      newMeta: baseMeta({ internalLinkCount: 0 }),
      renderedMeta: { internalLinkCount: 2 },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('info')
  })

  it('fires with warning if CSR has 0 internal links', () => {
    const results = runRule('rec_internal_links_audit', ctx({
      newMeta: baseMeta({ internalLinkCount: 0 }),
      renderedMeta: { internalLinkCount: 0 },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
  })

  it('does not fire when CSR has >= 3 internal links', () => {
    const results = runRule('rec_internal_links_audit', ctx({
      newMeta: baseMeta({ internalLinkCount: 0 }),
      renderedMeta: { internalLinkCount: 5 },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_internal_links_missing_in_ssr', () => {
  it('does not fire in SSR-only phase', () => {
    const results = runRule('rec_internal_links_missing_in_ssr', ctx({
      newMeta: baseMeta({ internalLinkCount: 0 }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when SSR < 3 but CSR >= 3', () => {
    const results = runRule('rec_internal_links_missing_in_ssr', ctx({
      newMeta: baseMeta({ internalLinkCount: 1 }),
      renderedMeta: { internalLinkCount: 12 },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('info')
  })

  it('does not fire when SSR already >= 3', () => {
    const results = runRule('rec_internal_links_missing_in_ssr', ctx({
      newMeta: baseMeta({ internalLinkCount: 5 }),
      renderedMeta: { internalLinkCount: 12 },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire when CSR < 3 (handled by rec_internal_links_audit)', () => {
    const results = runRule('rec_internal_links_missing_in_ssr', ctx({
      newMeta: baseMeta({ internalLinkCount: 0 }),
      renderedMeta: { internalLinkCount: 1 },
    }))
    expect(results).toHaveLength(0)
  })
})

// ============================================================
// rec_structured_data_missing_audit (CSR-based) and rec_structured_data_missing_in_ssr
// ============================================================

describe('rec_structured_data_missing_audit', () => {
  it('does not fire in SSR phase', () => {
    const results = runRule('rec_structured_data_missing_audit', ctx({
      newMeta: baseMeta({ jsonLdTypes: [] }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when CSR has no JSON-LD', () => {
    const results = runRule('rec_structured_data_missing_audit', ctx({
      newMeta: baseMeta({ jsonLdTypes: [] }),
      renderedMeta: { jsonLdTypes: [] },
    }))
    expect(results).toHaveLength(1)
  })

  it('does not fire when CSR has JSON-LD', () => {
    const results = runRule('rec_structured_data_missing_audit', ctx({
      newMeta: baseMeta({ jsonLdTypes: [] }),
      renderedMeta: { jsonLdTypes: ['Article'] },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_structured_data_missing_in_ssr', () => {
  it('does not fire in SSR-only phase', () => {
    const results = runRule('rec_structured_data_missing_in_ssr', ctx({
      newMeta: baseMeta({ jsonLdTypes: [] }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when SSR has no JSON-LD but CSR has some', () => {
    const results = runRule('rec_structured_data_missing_in_ssr', ctx({
      newMeta: baseMeta({ jsonLdTypes: [] }),
      renderedMeta: { jsonLdTypes: ['Article', 'BreadcrumbList'] },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
    expect(results[0].currentValue).toBe('Article, BreadcrumbList')
  })

  it('does not fire when SSR already has JSON-LD', () => {
    const results = runRule('rec_structured_data_missing_in_ssr', ctx({
      newMeta: baseMeta({ jsonLdTypes: ['Organization'] }),
      renderedMeta: { jsonLdTypes: ['Organization', 'BreadcrumbList'] },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire when CSR has none either', () => {
    const results = runRule('rec_structured_data_missing_in_ssr', ctx({
      newMeta: baseMeta({ jsonLdTypes: [] }),
      renderedMeta: { jsonLdTypes: [] },
    }))
    expect(results).toHaveLength(0)
  })
})

// ============================================================
// rec_img_alt_audit (CSR-based) and rec_img_alt_missing_in_ssr
// ============================================================

describe('rec_img_alt_audit', () => {
  it('does not fire in SSR phase', () => {
    const results = runRule('rec_img_alt_audit', ctx({
      newMeta: baseMeta({ images: imgsWithoutAlt(5) }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when CSR has images without alt', () => {
    const results = runRule('rec_img_alt_audit', ctx({
      newMeta: baseMeta({ images: [] }),
      renderedMeta: { images: imgsWithoutAlt(3) },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('info')
  })

  it('fires with warning when CSR has >= 10 images without alt', () => {
    const results = runRule('rec_img_alt_audit', ctx({
      newMeta: baseMeta({ images: [] }),
      renderedMeta: { images: imgsWithoutAlt(15) },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('warning')
  })

  it('does not fire when all CSR images have alt', () => {
    const results = runRule('rec_img_alt_audit', ctx({
      newMeta: baseMeta({ images: [] }),
      renderedMeta: {
        images: [
          { src: 'a.jpg', alt: 'Alt A', inLink: false },
          { src: 'b.jpg', alt: 'Alt B', inLink: false },
        ],
      },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_img_alt_missing_in_ssr', () => {
  it('does not fire in SSR-only phase', () => {
    const results = runRule('rec_img_alt_missing_in_ssr', ctx({
      newMeta: baseMeta({ images: [] }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when CSR adds new images without alt', () => {
    const results = runRule('rec_img_alt_missing_in_ssr', ctx({
      newMeta: baseMeta({ images: [{ src: 'static.jpg', alt: 'Hero', inLink: false }] }),
      renderedMeta: {
        images: [
          { src: 'static.jpg', alt: 'Hero', inLink: false },
          { src: 'lazy1.jpg', alt: null, inLink: false },
          { src: 'lazy2.jpg', alt: null, inLink: false },
        ],
      },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('info')
  })

  it('does not fire when CSR images all have alt', () => {
    const results = runRule('rec_img_alt_missing_in_ssr', ctx({
      newMeta: baseMeta({ images: [] }),
      renderedMeta: {
        images: [{ src: 'lazy.jpg', alt: 'Description', inLink: false }],
      },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire when missing-alt images exist already in SSR (handled by rec_img_alt_audit)', () => {
    const ssrImgs = [{ src: 'a.jpg', alt: null, inLink: false }]
    const results = runRule('rec_img_alt_missing_in_ssr', ctx({
      newMeta: baseMeta({ images: ssrImgs }),
      renderedMeta: { images: ssrImgs },
    }))
    expect(results).toHaveLength(0)
  })
})

// ============================================================
// rec_semantic_structure_audit (CSR-based) and rec_semantic_structure_missing_in_ssr
// ============================================================

describe('rec_semantic_structure_audit', () => {
  it('does not fire in SSR phase', () => {
    const results = runRule('rec_semantic_structure_audit', ctx({
      newMeta: baseMeta({ hasMain: false, hasHeader: false, hasFooter: false }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when CSR is missing main', () => {
    const results = runRule('rec_semantic_structure_audit', ctx({
      newMeta: baseMeta({ hasMain: true, hasHeader: true, hasFooter: true }),
      renderedMeta: { hasMain: false, hasHeader: true, hasFooter: true },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].currentValue).toBe('<main>')
  })

  it('does not fire when CSR has all 3 tags', () => {
    const results = runRule('rec_semantic_structure_audit', ctx({
      newMeta: baseMeta({ hasMain: false, hasHeader: false, hasFooter: false }),
      renderedMeta: { hasMain: true, hasHeader: true, hasFooter: true },
    }))
    expect(results).toHaveLength(0)
  })
})

describe('rec_semantic_structure_missing_in_ssr', () => {
  it('does not fire in SSR-only phase', () => {
    const results = runRule('rec_semantic_structure_missing_in_ssr', ctx({
      newMeta: baseMeta({ hasMain: false, hasHeader: false, hasFooter: false }),
      renderedMeta: null,
    }))
    expect(results).toHaveLength(0)
  })

  it('fires when CSR has main but SSR doesn\'t', () => {
    const results = runRule('rec_semantic_structure_missing_in_ssr', ctx({
      newMeta: baseMeta({ hasMain: false, hasHeader: false, hasFooter: false }),
      renderedMeta: { hasMain: true, hasHeader: true, hasFooter: true },
    }))
    expect(results).toHaveLength(1)
    expect(results[0].severity).toBe('info')
    expect(results[0].currentValue).toBe('<main>, <header>, <footer>')
  })

  it('does not fire when SSR already has all tags', () => {
    const results = runRule('rec_semantic_structure_missing_in_ssr', ctx({
      newMeta: baseMeta({ hasMain: true, hasHeader: true, hasFooter: true }),
      renderedMeta: { hasMain: true, hasHeader: true, hasFooter: true },
    }))
    expect(results).toHaveLength(0)
  })

  it('does not fire when CSR is also missing tags (handled by rec_semantic_structure_audit)', () => {
    const results = runRule('rec_semantic_structure_missing_in_ssr', ctx({
      newMeta: baseMeta({ hasMain: false, hasHeader: false, hasFooter: false }),
      renderedMeta: { hasMain: false, hasHeader: false, hasFooter: false },
    }))
    expect(results).toHaveLength(0)
  })
})

// ============================================================
// SIGNAL D'INTENTION SITEMAP — matrice complète (sitemap × statut)
// ============================================================

describe('matrice sitemap × statut — le sitemap décide de l alerte', () => {
  // ── page_redirected : scoping sitemap ──
  it('301 ENCORE au sitemap → page_redirected fire (incohérence)', () => {
    expect(runRule('page_redirected', ctx({
      pageUrl: 'https://example.com/old',
      oldMeta: baseMeta(),
      oldStatusCode: 200,
      newStatusCode: 301,
      inSitemap: true,
      newMeta: baseMeta({ redirectTarget: 'https://example.com/new' }),
    }))).toHaveLength(1)
  })

  it('301 HORS sitemap → silence (migration propre, le cas blog)', () => {
    expect(runRule('page_redirected', ctx({
      pageUrl: 'https://example.com/blog/article',
      oldMeta: baseMeta(),
      oldStatusCode: 200,
      newStatusCode: 301,
      inSitemap: false,
      newMeta: baseMeta({ redirectTarget: 'https://example.com/formations' }),
    }))).toHaveLength(0)
  })

  // ── status_code_changed : scoping sitemap ──
  it('404 ENCORE au sitemap → status_code_changed critical', () => {
    const r = runRule('status_code_changed', ctx({ oldStatusCode: 200, newStatusCode: 404, inSitemap: true }))
    expect(r).toHaveLength(1)
    expect(r[0]!.severity).toBe('critical')
  })

  it('404 HORS sitemap → status_code_changed muet (repris par rec_unclean_removal)', () => {
    expect(runRule('status_code_changed', ctx({ oldStatusCode: 200, newStatusCode: 404, inSitemap: false }))).toHaveLength(0)
  })

  it('410 HORS sitemap → silence total (suppression propre)', () => {
    expect(runRule('status_code_changed', ctx({ oldStatusCode: 200, newStatusCode: 410, inSitemap: false }))).toHaveLength(0)
    expect(runRule('rec_unclean_removal', ctx({ newStatusCode: 410, inSitemap: false }))).toHaveLength(0)
  })

  it('5xx → status_code_changed fire TOUJOURS, sitemap ou pas (serveur cassé jamais voulu)', () => {
    expect(runRule('status_code_changed', ctx({ oldStatusCode: 200, newStatusCode: 503, inSitemap: false }))).toHaveLength(1)
    expect(runRule('status_code_changed', ctx({ oldStatusCode: 200, newStatusCode: 503, inSitemap: true }))).toHaveLength(1)
  })

  it('inSitemap absent → défaut conservateur (on alerte comme si au sitemap)', () => {
    expect(runRule('status_code_changed', ctx({ oldStatusCode: 200, newStatusCode: 404 }))).toHaveLength(1)
  })

  // ── redirect_broken ──
  it('redirect_broken : 301 hors sitemap qui casse en 404 → fire (le jus fuit)', () => {
    const r = runRule('redirect_broken', ctx({ oldStatusCode: 301, newStatusCode: 404, inSitemap: false }))
    expect(r).toHaveLength(1)
    expect(r[0]!.severity).toBe('warning')
  })

  it('redirect_broken : ne fire PAS au sitemap (status_code_changed porte l incident)', () => {
    expect(runRule('redirect_broken', ctx({ oldStatusCode: 301, newStatusCode: 404, inSitemap: true }))).toHaveLength(0)
  })

  it('redirect_broken : ne fire PAS si la baseline n était pas une redirection, ni sur 5xx', () => {
    expect(runRule('redirect_broken', ctx({ oldStatusCode: 200, newStatusCode: 404, inSitemap: false }))).toHaveLength(0)
    expect(runRule('redirect_broken', ctx({ oldStatusCode: 301, newStatusCode: 503, inSitemap: false }))).toHaveLength(0)
    expect(runRule('redirect_broken', ctx({ oldStatusCode: null, newStatusCode: 404, inSitemap: false }))).toHaveLength(0)
  })

  // ── rec_redirect_temporary ──
  it('rec_redirect_temporary : 302/307 hors sitemap → info ; 301 ou au sitemap → rien', () => {
    expect(runRule('rec_redirect_temporary', ctx({ newStatusCode: 302, inSitemap: false }))).toHaveLength(1)
    expect(runRule('rec_redirect_temporary', ctx({ newStatusCode: 307, inSitemap: false }))).toHaveLength(1)
    expect(runRule('rec_redirect_temporary', ctx({ newStatusCode: 301, inSitemap: false }))).toHaveLength(0)
    expect(runRule('rec_redirect_temporary', ctx({ newStatusCode: 302, inSitemap: true }))).toHaveLength(0)
  })

  // ── rec_unclean_removal ──
  it('rec_unclean_removal : 404 hors sitemap → info ; 404 au sitemap ou 410 → rien', () => {
    const r = runRule('rec_unclean_removal', ctx({ newStatusCode: 404, inSitemap: false }))
    expect(r).toHaveLength(1)
    expect(r[0]!.severity).toBe('info')
    expect(runRule('rec_unclean_removal', ctx({ newStatusCode: 404, inSitemap: true }))).toHaveLength(0)
  })

  // ── cascades (filterByPriority) ──
  it('404 hors sitemap : la cascade *_missing est supprimée, seule rec_unclean_removal reste', () => {
    const results = runAllRules(ctx({
      pageUrl: 'https://example.com/deleted',
      oldMeta: baseMeta({ title: 'Ancien titre', description: 'Ancienne desc' }),
      oldStatusCode: 200,
      newStatusCode: 404,
      inSitemap: false,
      newMeta: baseMeta({ title: null, description: null }),
    }))
    expect(results.map(r => r.type)).toEqual(['rec_unclean_removal'])
  })

  it('301 hors sitemap (migration propre complète) → ZÉRO alerte', () => {
    const results = runAllRules(ctx({
      pageUrl: 'https://example.com/blog/article',
      oldMeta: baseMeta({ title: 'Article', description: 'Desc' }),
      oldStatusCode: 200,
      newStatusCode: 301,
      inSitemap: false,
      newMeta: baseMeta({ title: null, description: null, isRedirected: true, redirectTarget: 'https://example.com/formations' }),
    }))
    expect(results).toHaveLength(0)
  })

  it('302 hors sitemap → uniquement rec_redirect_temporary (pas de contenu fantôme)', () => {
    const results = runAllRules(ctx({
      pageUrl: 'https://example.com/promo',
      oldMeta: baseMeta({ title: 'Promo' }),
      oldStatusCode: 200,
      newStatusCode: 302,
      inSitemap: false,
      newMeta: baseMeta({ title: null, isRedirected: true, redirectTarget: 'https://example.com/accueil-promo' }),
    }))
    expect(results.map(r => r.type)).toEqual(['rec_redirect_temporary'])
  })
})

describe('redirect_broken — la cible d origine est figée dans l alerte à la transition', () => {
  it('porte la cible connue (baseline) en DONNÉE BRUTE dans previousValue — jamais de chaîne composée', () => {
    const r = runRule('redirect_broken', ctx({
      oldStatusCode: 301,
      newStatusCode: 404,
      inSitemap: false,
      oldRedirectTarget: 'https://example.com/formations',
    }))
    expect(r).toHaveLength(1)
    expect(r[0]!.previousValue).toBe('https://example.com/formations')
    expect(r[0]!.currentValue).toBe('404')
    expect(r[0]!.message).toContain('https://example.com/formations')
  })

  it('reste utilisable sans cible connue (fallback status codes)', () => {
    const r = runRule('redirect_broken', ctx({ oldStatusCode: 301, newStatusCode: 404, inSitemap: false }))
    expect(r).toHaveLength(1)
    expect(r[0]!.previousValue).toBe('301')
  })
})

describe('redirect_broken — le 410 volontaire n est pas une redirection cassée', () => {
  it('3xx → 410 hors sitemap (bascule Gone assumée) → silence', () => {
    expect(runRule('redirect_broken', ctx({ oldStatusCode: 301, newStatusCode: 410, inSitemap: false }))).toHaveLength(0)
  })

  it('3xx → 404 hors sitemap (casse accidentelle) → fire toujours', () => {
    expect(runRule('redirect_broken', ctx({ oldStatusCode: 301, newStatusCode: 404, inSitemap: false }))).toHaveLength(1)
  })
})

describe('rec_sitemap_noindex_conflict — le sitemap déclare, la page dit noindex', () => {
  it('fire : page au sitemap + noindex (meta robots) — dès le 1er crawl (état installé, pas de baseline)', () => {
    const r = runRule('rec_sitemap_noindex_conflict', ctx({
      oldMeta: null,
      inSitemap: true,
      newMeta: baseMeta({ robots: 'noindex, follow' }),
    }))
    expect(r).toHaveLength(1)
    expect(r[0]!.severity).toBe('warning')
    expect(r[0]!.currentValue).toBe('meta robots')
  })

  it('détecte les 3 sources : meta googlebot et en-tête X-Robots-Tag aussi', () => {
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      inSitemap: true,
      newMeta: baseMeta({ robotsGooglebot: 'noindex' }),
    }))[0]!.currentValue).toBe('meta googlebot')
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      inSitemap: true,
      newMeta: baseMeta({ xRobotsTag: 'noindex' }),
    }))[0]!.currentValue).toBe('x-robots-tag')
  })

  it('silence : noindex mais HORS sitemap (le cas /legal/cookies — aucune contradiction)', () => {
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      inSitemap: false,
      newMeta: baseMeta({ robots: 'noindex, follow' }),
    }))).toHaveLength(0)
  })

  it('silence : au sitemap mais indexable (le cas /docs/self-hosted)', () => {
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      inSitemap: true,
      newMeta: baseMeta({ robots: 'index, follow' }),
    }))).toHaveLength(0)
  })

  it('inSitemap absent → défaut conservateur (considérée au sitemap) → fire', () => {
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      newMeta: baseMeta({ robots: 'noindex' }),
    }))).toHaveLength(1)
  })

  it('phase CSR (renderedMeta présent) → silence (déjà évalué en SSR, inSitemap non fourni en CSR)', () => {
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      renderedMeta: {},
      newMeta: baseMeta({ robots: 'noindex' }),
    }))).toHaveLength(0)
  })
})

describe('noindex — la directive « none » (= noindex + nofollow) est couverte partout', () => {
  it('rec_sitemap_noindex_conflict fire sur content="none" (segment complet, seul ou en liste)', () => {
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      inSitemap: true,
      newMeta: baseMeta({ robots: 'none' }),
    }))).toHaveLength(1)
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      inSitemap: true,
      newMeta: baseMeta({ xRobotsTag: 'nofollow, none' }),
    }))).toHaveLength(1)
  })

  it('JAMAIS de faux positif : max-image-preview:none (directive à valeur) et « nonexistent » ne matchent pas', () => {
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      inSitemap: true,
      newMeta: baseMeta({ robots: 'index, follow, max-image-preview:none' }),
    }))).toHaveLength(0)
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      inSitemap: true,
      newMeta: baseMeta({ robots: 'nonexistent-directive' }),
    }))).toHaveLength(0)
    // Faux négatif ASSUMÉ (conservateur) : la forme agent-préfixée « googlebot: none » n est pas
    // détectée — indissociable proprement des directives à valeur comme max-image-preview:none.
    expect(runRule('rec_sitemap_noindex_conflict', ctx({
      inSitemap: true,
      newMeta: baseMeta({ xRobotsTag: 'googlebot: none' }),
    }))).toHaveLength(0)
  })

  it('noindex_added fire aussi sur la transition index → none', () => {
    expect(runRule('noindex_added', ctx({
      oldMeta: baseMeta({ robots: 'index, follow' }),
      newMeta: baseMeta({ robots: 'none' }),
    }))).toHaveLength(1)
  })
})
