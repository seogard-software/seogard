import { describe, it, expect } from 'vitest'
import { extractUrls, buildCandidateUrls, normalizePageUrl } from './sitemap'

// ---------------------------------------------------------------------------
// extractUrls — all sitemap formats
// ---------------------------------------------------------------------------

describe('extractUrls', () => {
  // --- Standard (WordPress, Nuxt, Next.js, most CMS) ---

  it('standard sitemap — plain <loc> tags', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/page-1</loc></url>
  <url><loc>https://example.com/page-2</loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://example.com/page-1',
      'https://example.com/page-2',
    ])
  })

  it('standard sitemap index — plain <loc> tags', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-posts.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>
</sitemapindex>`
    expect(extractUrls(xml, 'sitemap')).toEqual([
      'https://example.com/sitemap-posts.xml',
      'https://example.com/sitemap-pages.xml',
    ])
  })

  // --- CDATA (PrestaShop, Magento, some Shopify apps) ---

  it('CDATA-wrapped <loc> tags (PrestaShop style)', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc><![CDATA[https://shop.com/product-1.html]]></loc></url>
  <url><loc><![CDATA[https://shop.com/product-2.html]]></loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://shop.com/product-1.html',
      'https://shop.com/product-2.html',
    ])
  })

  it('CDATA-wrapped sitemap index (PrestaShop style)', () => {
    const xml = `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc><![CDATA[https://shop.com/sitemap/product/1.xml]]></loc></sitemap>
  <sitemap><loc><![CDATA[https://shop.com/sitemap/category.xml]]></loc></sitemap>
</sitemapindex>`
    expect(extractUrls(xml, 'sitemap')).toEqual([
      'https://shop.com/sitemap/product/1.xml',
      'https://shop.com/sitemap/category.xml',
    ])
  })

  // --- Mixed: CDATA + plain in same file ---

  it('mixed CDATA and plain <loc> in same sitemap', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/plain</loc></url>
  <url><loc><![CDATA[https://example.com/cdata]]></loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://example.com/plain',
      'https://example.com/cdata',
    ])
  })

  // --- Whitespace / formatting variations ---

  it('whitespace around URLs inside <loc>', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>
    https://example.com/spaced
  </loc></url>
  <url><loc>  <![CDATA[  https://example.com/spaced-cdata  ]]>  </loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://example.com/spaced',
      'https://example.com/spaced-cdata',
    ])
  })

  // --- Extra tags (lastmod, changefreq, priority, image) ---

  it('sitemap with lastmod, changefreq, priority, image tags', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://shop.com/product-1</loc>
    <lastmod>2026-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>https://shop.com/img/product-1.webp</image:loc>
    </image:image>
  </url>
  <url>
    <loc><![CDATA[https://shop.com/product-2]]></loc>
    <lastmod>2026-02-01</lastmod>
    <priority>0.6</priority>
  </url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://shop.com/product-1',
      'https://shop.com/product-2',
    ])
  })

  // --- Chromium XML viewer wrapping (Playwright page.content()) ---

  it('Chromium XML viewer HTML wrapping (Playwright output)', () => {
    const xml = `<html xmlns="http://www.w3.org/1999/xhtml"><head><style id="xml-viewer-style">/* Chrome styles */</style></head><body>
<div id="webkit-xml-viewer-source-xml"><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap><loc><![CDATA[https://shop.com/sitemap/product/1.xml]]></loc></sitemap>
<sitemap><loc><![CDATA[https://shop.com/sitemap/category.xml]]></loc></sitemap>
</sitemapindex></div>
<div class="pretty-print"></div></body></html>`
    expect(extractUrls(xml, 'sitemap')).toEqual([
      'https://shop.com/sitemap/product/1.xml',
      'https://shop.com/sitemap/category.xml',
    ])
  })

  // --- WordPress wp-sitemap.xml style ---

  it('WordPress wp-sitemap style with xsl stylesheet', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/wp-sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://blog.com/wp-sitemap-posts-post-1.xml</loc><lastmod>2026-02-20T12:00:00+00:00</lastmod></sitemap>
  <sitemap><loc>https://blog.com/wp-sitemap-posts-page-1.xml</loc></sitemap>
  <sitemap><loc>https://blog.com/wp-sitemap-taxonomies-category-1.xml</loc></sitemap>
</sitemapindex>`
    expect(extractUrls(xml, 'sitemap')).toEqual([
      'https://blog.com/wp-sitemap-posts-post-1.xml',
      'https://blog.com/wp-sitemap-posts-page-1.xml',
      'https://blog.com/wp-sitemap-taxonomies-category-1.xml',
    ])
  })

  // --- Yoast SEO style (WordPress plugin) ---

  it('Yoast SEO sitemap with image:image namespace', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://blog.com/article-1/</loc><image:image><image:loc>https://blog.com/img/article-1.jpg</image:loc></image:image></url>
  <url><loc>https://blog.com/article-2/</loc></url>
</urlset>`
    // trailing slashes stripped by normalizePageUrl
    expect(extractUrls(xml, 'url')).toEqual([
      'https://blog.com/article-1',
      'https://blog.com/article-2',
    ])
  })

  // --- URLs with special characters ---

  it('URLs with query params and encoded chars', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/search?q=test&amp;page=1</loc></url>
  <url><loc><![CDATA[https://example.com/path/with spaces?foo=bar&baz=1]]></loc></url>
  <url><loc>https://example.com/caf%C3%A9</loc></url>
</urlset>`
    const urls = extractUrls(xml, 'url')
    expect(urls).toHaveLength(3)
    expect(urls[0]).toBe('https://example.com/search?q=test&amp;page=1')
    expect(urls[1]).toBe('https://example.com/path/with spaces?foo=bar&baz=1')
    // percent-encoded chars are decoded by normalizePageUrl
    expect(urls[2]).toBe('https://example.com/café')
  })

  // --- Non-page URL filtering ---

  it('filters out image URLs (.jpg, .png, .webp, etc.)', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/page-1</loc></url>
  <url><loc>https://example.com/images/photo.jpg</loc></url>
  <url><loc>https://example.com/images/banner.png</loc></url>
  <url><loc>https://example.com/images/hero.webp</loc></url>
  <url><loc>https://example.com/images/logo.svg</loc></url>
  <url><loc>https://example.com/page-2</loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://example.com/page-1',
      'https://example.com/page-2',
    ])
  })

  it('filters out PDF and document URLs', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/about</loc></url>
  <url><loc>https://example.com/docs/guide.pdf</loc></url>
  <url><loc>https://example.com/files/report.docx</loc></url>
  <url><loc>https://example.com/data/export.xlsx</loc></url>
  <url><loc>https://example.com/contact</loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://example.com/about',
      'https://example.com/contact',
    ])
  })

  it('filters out video and audio URLs', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/blog/post-1</loc></url>
  <url><loc>https://cdn.example.com/media/video.mp4</loc></url>
  <url><loc>https://cdn.example.com/media/podcast.mp3</loc></url>
  <url><loc>https://example.com/blog/post-2</loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://example.com/blog/post-1',
      'https://example.com/blog/post-2',
    ])
  })

  it('filters out archive URLs (.zip, .gz, etc.)', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/downloads</loc></url>
  <url><loc>https://example.com/files/archive.zip</loc></url>
  <url><loc>https://example.com/files/backup.tar.gz</loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://example.com/downloads',
    ])
  })

  it('keeps .html and .php URLs (valid pages)', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/page.html</loc></url>
  <url><loc>https://example.com/index.php</loc></url>
  <url><loc>https://example.com/about.htm</loc></url>
  <url><loc>https://example.com/no-extension</loc></url>
  <url><loc>https://example.com/trailing-slash/</loc></url>
</urlset>`
    // trailing slash stripped by normalizePageUrl
    expect(extractUrls(xml, 'url')).toEqual([
      'https://example.com/page.html',
      'https://example.com/index.php',
      'https://example.com/about.htm',
      'https://example.com/no-extension',
      'https://example.com/trailing-slash',
    ])
  })

  it('does NOT filter sitemap index references (tag=sitemap)', () => {
    const xml = `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-images.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-news.xml.gz</loc></sitemap>
</sitemapindex>`
    expect(extractUrls(xml, 'sitemap')).toEqual([
      'https://example.com/sitemap-images.xml',
      'https://example.com/sitemap-pages.xml',
      'https://example.com/sitemap-news.xml.gz',
    ])
  })

  it('filters non-page URLs with CDATA wrapping', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc><![CDATA[https://shop.com/product-1]]></loc></url>
  <url><loc><![CDATA[https://shop.com/images/product-1.jpeg]]></loc></url>
  <url><loc><![CDATA[https://shop.com/product-2]]></loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://shop.com/product-1',
      'https://shop.com/product-2',
    ])
  })

  it('filters image URLs from Yoast-style sitemap (image:image namespace)', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://blog.com/article-1/</loc>
    <image:image><image:loc>https://blog.com/img/article-1.jpg</image:loc></image:image>
  </url>
  <url><loc>https://blog.com/img/standalone.avif</loc></url>
  <url><loc>https://blog.com/article-2/</loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://blog.com/article-1',
      'https://blog.com/article-2',
    ])
  })

  // --- Empty / malformed ---

  it('empty sitemap returns empty array', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([])
  })

  it('<url> block without <loc> is skipped', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><lastmod>2026-01-01</lastmod></url>
  <url><loc>https://example.com/valid</loc></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual(['https://example.com/valid'])
  })

  it('garbage XML returns empty array', () => {
    expect(extractUrls('not xml at all', 'url')).toEqual([])
    expect(extractUrls('<html><body>Hello</body></html>', 'url')).toEqual([])
  })

  // --- Shopify style (very minimal) ---

  it('Shopify minimal sitemap', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
<url><loc>https://myshop.myshopify.com/</loc><lastmod>2026-02-20T00:00:00+00:00</lastmod><changefreq>daily</changefreq></url>
<url><loc>https://myshop.myshopify.com/collections</loc><lastmod>2026-02-20T00:00:00+00:00</lastmod><changefreq>daily</changefreq></url>
</urlset>`
    expect(extractUrls(xml, 'url')).toEqual([
      'https://myshop.myshopify.com/',
      'https://myshop.myshopify.com/collections',
    ])
  })

  // --- Large count (performance sanity) ---

  it('handles 1000 URLs without issue', () => {
    const entries = Array.from({ length: 1000 }, (_, i) =>
      `<url><loc>https://example.com/page-${i}</loc></url>`,
    ).join('\n')
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`
    const urls = extractUrls(xml, 'url')
    expect(urls).toHaveLength(1000)
    expect(urls[0]).toBe('https://example.com/page-0')
    expect(urls[999]).toBe('https://example.com/page-999')
  })
})

// ---------------------------------------------------------------------------
// buildCandidateUrls
// ---------------------------------------------------------------------------

describe('buildCandidateUrls', () => {
  it('puts robots.txt URLs first, then common paths', () => {
    const candidates = buildCandidateUrls('https://example.com', [
      'https://example.com/custom-sitemap.xml',
    ])
    expect(candidates[0]).toBe('https://example.com/custom-sitemap.xml')
    expect(candidates).toContain('https://example.com/sitemap.xml')
    expect(candidates).toContain('https://example.com/wp-sitemap.xml')
  })

  it('deduplicates if robots URL matches a common path', () => {
    const candidates = buildCandidateUrls('https://example.com', [
      'https://example.com/sitemap.xml',
    ])
    const sitemapCount = candidates.filter(u => u === 'https://example.com/sitemap.xml').length
    expect(sitemapCount).toBe(1)
  })

  it('returns only common paths if no robots URLs', () => {
    const candidates = buildCandidateUrls('https://example.com', [])
    expect(candidates[0]).toBe('https://example.com/sitemap.xml')
    expect(candidates.length).toBe(10) // COMMON_SITEMAP_PATHS count
  })
})

// ---------------------------------------------------------------------------
// normalizePageUrl
// ---------------------------------------------------------------------------

describe('normalizePageUrl', () => {
  it('strips trailing slash', () => {
    expect(normalizePageUrl('https://example.com/blog/')).toBe('https://example.com/blog')
  })

  it('keeps root slash', () => {
    expect(normalizePageUrl('https://example.com/')).toBe('https://example.com/')
  })

  it('strips fragment', () => {
    expect(normalizePageUrl('https://example.com/page#section')).toBe('https://example.com/page')
  })

  it('decodes percent-encoded chars', () => {
    expect(normalizePageUrl('https://example.com/caf%C3%A9')).toBe('https://example.com/café')
  })

  it('lowercases hostname', () => {
    expect(normalizePageUrl('https://EXAMPLE.COM/Page')).toBe('https://example.com/Page')
  })

  it('preserves path case', () => {
    expect(normalizePageUrl('https://example.com/Blog/Article-1')).toBe('https://example.com/Blog/Article-1')
  })

  it('preserves query string', () => {
    expect(normalizePageUrl('https://example.com/search?q=test')).toBe('https://example.com/search?q=test')
  })

  it('strips trailing slash + fragment together', () => {
    expect(normalizePageUrl('https://example.com/page/#top')).toBe('https://example.com/page')
  })

  it('returns original if invalid URL', () => {
    expect(normalizePageUrl('not-a-url')).toBe('not-a-url')
  })

  it('deduplicates trailing slash variants in extractUrls', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/blog/</loc></url>
  <url><loc>https://example.com/blog</loc></url>
  <url><loc>https://example.com/about</loc></url>
</urlset>`
    // Both /blog/ and /blog normalize to /blog — extractUrls returns both
    // but discoverSitemapHttp deduplicates via Set
    const urls = extractUrls(xml, 'url')
    expect(urls).toEqual([
      'https://example.com/blog',
      'https://example.com/blog',
      'https://example.com/about',
    ])
  })
})
