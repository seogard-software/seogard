import { describe, it, expect } from 'vitest'
import {
  extractAllHeadings,
  extractLinks,
  extractAllImages,
  extractSemanticStructure,
  extractFavicon,
} from '../../crawler/fetcher'

// ============================================================
// extractAllHeadings
// ============================================================

describe('extractAllHeadings', () => {
  it('extracts all heading levels', () => {
    const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>'
    const result = extractAllHeadings(html)
    expect(result).toEqual([
      { level: 1, text: 'Title' },
      { level: 2, text: 'Subtitle' },
      { level: 3, text: 'Section' },
    ])
  })

  it('strips inner HTML tags from heading text', () => {
    const html = '<h1><span class="big">Hello</span> <em>World</em></h1>'
    const result = extractAllHeadings(html)
    expect(result).toEqual([{ level: 1, text: 'Hello World' }])
  })

  it('handles multiple H1 tags', () => {
    const html = '<h1>First H1</h1><h1>Second H1</h1>'
    const result = extractAllHeadings(html)
    expect(result).toHaveLength(2)
    expect(result[0].text).toBe('First H1')
    expect(result[1].text).toBe('Second H1')
  })

  it('skips empty headings', () => {
    const html = '<h1></h1><h2>   </h2><h3>Real</h3>'
    const result = extractAllHeadings(html)
    expect(result).toEqual([{ level: 3, text: 'Real' }])
  })

  it('returns empty array for no headings', () => {
    expect(extractAllHeadings('<p>No headings here</p>')).toEqual([])
  })

  it('handles H4-H6 levels', () => {
    const html = '<h4>Four</h4><h5>Five</h5><h6>Six</h6>'
    const result = extractAllHeadings(html)
    expect(result).toHaveLength(3)
    expect(result.map(h => h.level)).toEqual([4, 5, 6])
  })

  it('handles headings with attributes', () => {
    const html = '<h1 class="title" id="main">Heading</h1>'
    const result = extractAllHeadings(html)
    expect(result).toEqual([{ level: 1, text: 'Heading' }])
  })
})

// ============================================================
// extractLinks
// ============================================================

describe('extractLinks', () => {
  it('separates internal and external links', () => {
    const html = `
      <a href="/about">About</a>
      <a href="https://example.com/products">Products</a>
      <a href="https://other.com/page">External</a>
    `
    const result = extractLinks(html, 'https://example.com/')
    expect(result.internalLinks).toHaveLength(2)
    expect(result.externalLinks).toHaveLength(1)
    expect(result.externalLinks[0].href).toBe('https://other.com/page')
  })

  it('resolves relative URLs', () => {
    const html = '<a href="/about">About</a>'
    const result = extractLinks(html, 'https://example.com/page')
    expect(result.internalLinks[0].href).toBe('https://example.com/about')
  })

  it('extracts anchor text', () => {
    const html = '<a href="/page">Click Here</a>'
    const result = extractLinks(html, 'https://example.com/')
    expect(result.internalLinks[0].anchor).toBe('Click Here')
  })

  it('extracts rel attribute', () => {
    const html = '<a href="https://other.com" rel="nofollow">Link</a>'
    const result = extractLinks(html, 'https://example.com/')
    expect(result.externalLinks[0].rel).toBe('nofollow')
  })

  it('sets rel to null when absent', () => {
    const html = '<a href="/page">Link</a>'
    const result = extractLinks(html, 'https://example.com/')
    expect(result.internalLinks[0].rel).toBeNull()
  })

  it('skips anchor-only links', () => {
    const html = '<a href="#section">Section</a>'
    const result = extractLinks(html, 'https://example.com/')
    expect(result.internalLinks).toHaveLength(0)
    expect(result.externalLinks).toHaveLength(0)
  })

  it('skips javascript: links', () => {
    const html = '<a href="javascript:void(0)">Click</a>'
    const result = extractLinks(html, 'https://example.com/')
    expect(result.internalLinks).toHaveLength(0)
  })

  it('skips mailto: and tel: links', () => {
    const html = '<a href="mailto:test@test.com">Email</a><a href="tel:+33123">Call</a>'
    const result = extractLinks(html, 'https://example.com/')
    expect(result.internalLinks).toHaveLength(0)
    expect(result.externalLinks).toHaveLength(0)
  })

  it('strips HTML from anchor text', () => {
    const html = '<a href="/page"><span>Bold</span> text</a>'
    const result = extractLinks(html, 'https://example.com/')
    expect(result.internalLinks[0].anchor).toBe('Bold text')
  })

  it('returns empty for invalid page URL', () => {
    const html = '<a href="/page">Link</a>'
    const result = extractLinks(html, 'not-a-url')
    expect(result.internalLinks).toHaveLength(0)
    expect(result.externalLinks).toHaveLength(0)
  })

  it('handles links without href', () => {
    const html = '<a name="anchor">No href</a>'
    const result = extractLinks(html, 'https://example.com/')
    expect(result.internalLinks).toHaveLength(0)
  })
})

// ============================================================
// extractAllImages
// ============================================================

describe('extractAllImages', () => {
  it('extracts images with src and alt', () => {
    const html = '<img src="photo.jpg" alt="Photo">'
    const result = extractAllImages(html)
    expect(result.images).toEqual([{ src: 'photo.jpg', alt: 'Photo', inLink: false }])
    expect(result.imgCount).toBe(1)
  })

  it('sets alt to null when missing', () => {
    const html = '<img src="photo.jpg">'
    const result = extractAllImages(html)
    expect(result.images[0].alt).toBeNull()
  })

  it('detects images inside links', () => {
    const html = '<a href="/page"><img src="icon.png" alt="Icon"></a>'
    const result = extractAllImages(html)
    expect(result.images[0].inLink).toBe(true)
  })

  it('detects images outside links', () => {
    const html = '<p><img src="photo.jpg" alt="Photo"></p>'
    const result = extractAllImages(html)
    expect(result.images[0].inLink).toBe(false)
  })

  it('handles multiple images', () => {
    const html = '<img src="a.jpg" alt="A"><img src="b.jpg"><img src="c.jpg" alt="C">'
    const result = extractAllImages(html)
    expect(result.imgCount).toBe(3)
    expect(result.images[0].alt).toBe('A')
    expect(result.images[1].alt).toBeNull()
    expect(result.images[2].alt).toBe('C')
  })

  it('returns empty for no images', () => {
    const result = extractAllImages('<p>No images</p>')
    expect(result.images).toEqual([])
    expect(result.imgCount).toBe(0)
  })

  it('handles empty alt attribute', () => {
    const html = '<img src="decorative.png" alt="">'
    const result = extractAllImages(html)
    expect(result.images[0].alt).toBe('')
  })

  it('skips img without src', () => {
    const html = '<img alt="No source">'
    const result = extractAllImages(html)
    expect(result.images).toHaveLength(0)
  })
})

// ============================================================
// extractSemanticStructure
// ============================================================

describe('extractSemanticStructure', () => {
  it('detects all semantic elements', () => {
    const html = '<header>H</header><nav>N</nav><main>M</main><footer>F</footer><article>A</article>'
    const result = extractSemanticStructure(html)
    expect(result).toEqual({
      hasHeader: true,
      hasNav: true,
      hasMain: true,
      hasFooter: true,
      hasArticle: true,
    })
  })

  it('returns false for all when no semantic elements', () => {
    const html = '<div>Just divs</div>'
    const result = extractSemanticStructure(html)
    expect(result.hasHeader).toBe(false)
    expect(result.hasNav).toBe(false)
    expect(result.hasMain).toBe(false)
    expect(result.hasFooter).toBe(false)
    expect(result.hasArticle).toBe(false)
  })

  it('detects partial semantic structure', () => {
    const html = '<header>H</header><main>Content</main>'
    const result = extractSemanticStructure(html)
    expect(result.hasHeader).toBe(true)
    expect(result.hasMain).toBe(true)
    expect(result.hasNav).toBe(false)
    expect(result.hasFooter).toBe(false)
    expect(result.hasArticle).toBe(false)
  })

  it('handles self-closing/attribute tags', () => {
    const html = '<header class="site-header"><nav id="main-nav">Links</nav></header>'
    const result = extractSemanticStructure(html)
    expect(result.hasHeader).toBe(true)
    expect(result.hasNav).toBe(true)
  })
})

// ============================================================
// extractFavicon
// ============================================================

describe('extractFavicon', () => {
  it('extracts link[rel="icon"]', () => {
    const html = '<link rel="icon" href="/favicon.ico">'
    expect(extractFavicon(html)).toBe('/favicon.ico')
  })

  it('extracts link[rel="shortcut icon"] as fallback', () => {
    const html = '<link rel="shortcut icon" href="/old-favicon.ico">'
    expect(extractFavicon(html)).toBe('/old-favicon.ico')
  })

  it('prefers rel="icon" over "shortcut icon"', () => {
    const html = '<link rel="shortcut icon" href="/old.ico"><link rel="icon" href="/new.png">'
    expect(extractFavicon(html)).toBe('/new.png')
  })

  it('returns null when no favicon link', () => {
    const html = '<link rel="stylesheet" href="/style.css">'
    expect(extractFavicon(html)).toBeNull()
  })

  it('handles favicon with type attribute', () => {
    const html = '<link rel="icon" type="image/png" href="/favicon.png">'
    expect(extractFavicon(html)).toBe('/favicon.png')
  })
})
