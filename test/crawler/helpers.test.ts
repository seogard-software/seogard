import { describe, it, expect } from 'vitest'
import { truncate, normalizeForCompare, isCsrBlocked, isSsrBlocked, decodeEntities } from '../../crawler/rules/helpers'
import { detectSoft404 } from '../../crawler/fetcher'
import type { PageMeta } from '../../crawler/fetcher'

function stubMeta(overrides: Partial<PageMeta> = {}): PageMeta {
  return {
    title: null, description: null, canonical: null, robots: null,
    ogTitle: null, ogDescription: null, ogImage: null, ogUrl: null, ogType: null,
    twitterCard: null, twitterTitle: null, twitterImage: null,
    viewport: null, lang: null, charset: null,
    hreflangs: [], jsonLdTypes: [], jsonLdValid: true,
    hasMetaRefresh: false, hasMixedContent: false, isSoft404: false,
    wordCount: 0, headings: [],
    internalLinks: [], externalLinks: [], internalLinkCount: 0, externalLinkCount: 0,
    images: [], imgCount: 0,
    ttfbMs: 0, totalFetchMs: 0, htmlSize: 0,
    responseHeaders: { cacheControl: null, contentType: null, xRobotsTag: null, server: null },
    finalUrl: '', isRedirected: false,
    hasHeader: false, hasNav: false, hasMain: false, hasFooter: false, hasArticle: false,
    favicon: null,
    ...overrides,
  }
}

describe('truncate', () => {
  it('returns string as-is if under max', () => {
    expect(truncate('short', 80)).toBe('short')
  })

  it('truncates and adds ellipsis', () => {
    expect(truncate('a'.repeat(100), 80)).toBe('a'.repeat(80) + '...')
  })

  it('uses default max of 80', () => {
    expect(truncate('a'.repeat(81))).toBe('a'.repeat(80) + '...')
    expect(truncate('a'.repeat(80))).toBe('a'.repeat(80))
  })
})

describe('decodeEntities', () => {
  it('decodes &amp;', () => {
    expect(decodeEntities('foo &amp; bar')).toBe('foo & bar')
  })

  it('decodes &nbsp; to non-breaking space', () => {
    expect(decodeEntities('hello&nbsp;world')).toBe('hello\u00A0world')
  })

  it('returns plain string unchanged', () => {
    expect(decodeEntities('no entities')).toBe('no entities')
  })
})

describe('normalizeForCompare', () => {
  it('normalizes &nbsp; to regular space', () => {
    expect(normalizeForCompare('hello&nbsp;world')).toBe('hello world')
  })

  it('normalizes \\u00A0 to regular space', () => {
    expect(normalizeForCompare('hello\u00A0world')).toBe('hello world')
  })

  it('handles double-encoded entities: &amp;nbsp;', () => {
    // This is the real-world bug: SSR has &amp;nbsp; which is double-encoded
    const ssr = 'Magic&amp;nbsp;5 Pro'
    const csr = 'Magic\u00A05 Pro'
    expect(normalizeForCompare(ssr)).toBe(normalizeForCompare(csr))
  })

  it('handles double-encoded &amp;amp;', () => {
    expect(normalizeForCompare('A &amp;amp; B')).toBe('A & B')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeForCompare('hello   world')).toBe('hello world')
  })

  it('trims whitespace', () => {
    expect(normalizeForCompare('  hello  ')).toBe('hello')
  })

  it('handles mixed entities and spaces', () => {
    const ssr = 'Find&amp;nbsp;X3 Pro &amp; Magic&amp;nbsp;V2'
    const csr = 'Find\u00A0X3 Pro & Magic\u00A0V2'
    expect(normalizeForCompare(ssr)).toBe(normalizeForCompare(csr))
  })
})

describe('isCsrBlocked', () => {
  it('returns true for tiny CSR content (<2000b)', () => {
    expect(isCsrBlocked(null, 500)).toBe(true)
  })

  it('returns false for normal CSR content', () => {
    expect(isCsrBlocked(null, 5000)).toBe(false)
  })

  it('returns true for WAF-blocked titles', () => {
    expect(isCsrBlocked({ title: 'Access Denied', description: null, canonical: null, robots: null, ogTitle: null, ogDescription: null, ogImage: null }, 5000)).toBe(true)
  })

  it('returns false for normal titles', () => {
    expect(isCsrBlocked({ title: 'My Product Page', description: null, canonical: null, robots: null, ogTitle: null, ogDescription: null, ogImage: null }, 5000)).toBe(false)
  })

  it('returns false for null meta and null content length', () => {
    expect(isCsrBlocked(null, null)).toBe(false)
  })
})

// ============================================================
// isSsrBlocked
// ============================================================

describe('isSsrBlocked', () => {
  it('returns true for 403 Forbidden', () => {
    expect(isSsrBlocked(403, 5000, stubMeta({ title: 'Access Denied' }))).toBe(true)
  })

  it('returns true for 403 even with normal-looking content', () => {
    expect(isSsrBlocked(403, 50000, stubMeta({ title: 'Real Title', description: 'Desc' }))).toBe(true)
  })

  it('returns true for WAF challenge title', () => {
    expect(isSsrBlocked(200, 5000, stubMeta({ title: 'Just a moment', description: 'Please wait' }))).toBe(true)
  })

  it('returns true for new WAF patterns', () => {
    expect(isSsrBlocked(200, 5000, stubMeta({ title: 'You have been blocked' }))).toBe(true)
    expect(isSsrBlocked(200, 5000, stubMeta({ title: 'Bot Protection Active' }))).toBe(true)
    expect(isSsrBlocked(200, 5000, stubMeta({ title: 'DDoS Protection by Cloudflare' }))).toBe(true)
  })

  it('returns true for small response with no meta', () => {
    expect(isSsrBlocked(200, 858, stubMeta())).toBe(true)
  })

  it('returns false for small response with a title', () => {
    expect(isSsrBlocked(200, 800, stubMeta({ title: 'Product Page' }))).toBe(false)
  })

  it('returns false for large response without meta', () => {
    expect(isSsrBlocked(200, 50000, stubMeta())).toBe(false)
  })

  it('returns false for normal page', () => {
    expect(isSsrBlocked(200, 5000, stubMeta({ title: 'Real Title', description: 'A real description', headings: [{ level: 1, text: 'Heading' }] }))).toBe(false)
  })

  it('returns false for small response with H1 heading', () => {
    expect(isSsrBlocked(200, 800, stubMeta({ headings: [{ level: 1, text: 'Product' }] }))).toBe(false)
  })
})

// ============================================================
// detectSoft404
// ============================================================

/** Build a realistic HTML page with a title and body content */
function soft404Html(title: string, bodyContent: string): string {
  return `<html><head><title>${title}</title></head><body>${bodyContent}</body></html>`
}

/** Generate filler words */
function filler(n: number): string {
  return ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor '.repeat(Math.ceil(n / 10))).trim()
}

describe('detectSoft404', () => {
  // --- True soft 404: body says "not found" + thin content ---

  it('detects EN soft 404: "page not found" in body', () => {
    const h = soft404Html('My Site', '<h1>Oops!</h1><p>The page not found. Please go back.</p>')
    expect(detectSoft404(h, 200, 15)).toBe(true)
  })

  it('detects FR soft 404: "page introuvable" in body', () => {
    const h = soft404Html('Mon Site', '<h1>Erreur</h1><p>Page introuvable. Retournez à l\'accueil.</p>')
    expect(detectSoft404(h, 200, 12)).toBe(true)
  })

  it('detects FR soft 404: "cette page n\'existe plus"', () => {
    const h = soft404Html('Mon Site', '<p>Désolé, cette page n\'existe plus.</p>')
    expect(detectSoft404(h, 200, 8)).toBe(true)
  })

  it('detects FR soft 404: "la page demandée n\'existe pas"', () => {
    const h = soft404Html('Erreur', '<p>La page demandée n\'existe pas. Veuillez réessayer.</p>')
    expect(detectSoft404(h, 200, 10)).toBe(true)
  })

  it('detects FR soft 404: "nous n\'avons pas trouvé"', () => {
    const h = soft404Html('Oups', '<p>Nous n\'avons pas trouvé la page que vous cherchez.</p>')
    expect(detectSoft404(h, 200, 12)).toBe(true)
  })

  it('detects FR soft 404: "page supprimée"', () => {
    const h = soft404Html('Supprimé', '<p>Cette page supprimée n\'est plus disponible.</p>')
    expect(detectSoft404(h, 200, 9)).toBe(true)
  })

  it('detects EN soft 404: "this page doesn\'t exist"', () => {
    const h = soft404Html('Error', '<p>Sorry, this page doesn\'t exist.</p>')
    expect(detectSoft404(h, 200, 7)).toBe(true)
  })

  it('detects EN soft 404: "this page does not exist"', () => {
    const h = soft404Html('Not Found', '<p>This page does not exist. Check the URL.</p>')
    expect(detectSoft404(h, 200, 10)).toBe(true)
  })

  it('detects EN soft 404: "no longer available"', () => {
    const h = soft404Html('Gone', '<p>This content is no longer available.</p>')
    expect(detectSoft404(h, 200, 8)).toBe(true)
  })

  it('detects EN soft 404: "page cannot be found"', () => {
    const h = soft404Html('Error', '<p>The page cannot be found.</p>')
    expect(detectSoft404(h, 200, 7)).toBe(true)
  })

  it('detects EN soft 404: "the page you requested"', () => {
    const h = soft404Html('Error', '<p>The page you requested does not exist.</p>')
    expect(detectSoft404(h, 200, 9)).toBe(true)
  })

  it('detects DE soft 404: "seite nicht gefunden"', () => {
    const h = soft404Html('Fehler', '<p>Die Seite nicht gefunden.</p>')
    expect(detectSoft404(h, 200, 6)).toBe(true)
  })

  it('detects ES soft 404: "pagina no encontrada"', () => {
    const h = soft404Html('Error', '<p>Pagina no encontrada.</p>')
    expect(detectSoft404(h, 200, 5)).toBe(true)
  })

  it('detects soft 404 with "page inexistante"', () => {
    const h = soft404Html('Oops', '<p>Page inexistante. Vérifiez l\'URL.</p>')
    expect(detectSoft404(h, 200, 6)).toBe(true)
  })

  it('detects EN soft 404: "the page you\'re looking for"', () => {
    const h = soft404Html('404', '<p>The page you\'re looking for cannot be found.</p>')
    expect(detectSoft404(h, 200, 10)).toBe(true)
  })

  it('detects FR soft 404: "la page que vous recherchez"', () => {
    const h = soft404Html('Erreur', '<p>La page que vous recherchez n\'existe pas.</p>')
    expect(detectSoft404(h, 200, 9)).toBe(true)
  })

  // --- NOT soft 404: product pages with "404" in model number ---

  it('does not flag "Acer C720-3404" (model number, rich content)', () => {
    const h = soft404Html('Acer C720-3404 : meilleur prix - Les Numériques', `<p>${filler(500)}</p>`)
    expect(detectSoft404(h, 200, 500)).toBe(false)
  })

  it('does not flag "Philips 22PFL3404" (model number)', () => {
    const h = soft404Html('Philips 22PFL3404 : meilleur prix', `<p>${filler(400)}</p>`)
    expect(detectSoft404(h, 200, 400)).toBe(false)
  })

  it('does not flag "Sony Handycam DCR-DVD404" (model number)', () => {
    const h = soft404Html('Sony Handycam DCR-DVD404', `<p>${filler(600)}</p>`)
    expect(detectSoft404(h, 200, 600)).toBe(false)
  })

  it('does not flag "Philips 19PFL3404" (model number)', () => {
    const h = soft404Html('Philips 19PFL3404', `<p>${filler(350)}</p>`)
    expect(detectSoft404(h, 200, 350)).toBe(false)
  })

  it('does not flag thin product page "DVD-404" (no 404 phrase in body)', () => {
    const h = soft404Html('Sony DVD-404', '<p>Produit retiré du catalogue. Voir nos autres produits.</p>')
    expect(detectSoft404(h, 200, 10)).toBe(false)
  })

  it('does not flag product named "Error 404 Game" with thin listing', () => {
    const h = soft404Html('Error 404 Game - Steam', '<p>Error 404 Game. Genre: puzzle. Price: 9.99€.</p>')
    expect(detectSoft404(h, 200, 12)).toBe(false)
  })

  // --- NOT soft 404: blog posts about 404 errors ---

  it('does not flag "Comment éviter les erreurs 404" (long blog article)', () => {
    const h = soft404Html('Comment éviter les erreurs 404', `<p>Les erreurs 404 page not found sont fréquentes. ${filler(1200)}</p>`)
    expect(detectSoft404(h, 200, 1200)).toBe(false)
  })

  it('does not flag "Guide : comprendre les codes 404 et 301" (long article)', () => {
    const h = soft404Html('Guide : comprendre les codes 404 et 301', `<p>${filler(800)}</p>`)
    expect(detectSoft404(h, 200, 800)).toBe(false)
  })

  it('does not flag "10 astuces pour corriger les 404 not found" (long article)', () => {
    const h = soft404Html('10 astuces pour corriger les 404 not found', `<article>${filler(2000)}</article>`)
    expect(detectSoft404(h, 200, 2000)).toBe(false)
  })

  // --- NOT soft 404: non-200 status codes ---

  it('returns false for actual 404 status code (not a soft 404)', () => {
    const h = soft404Html('Page not found', '<p>Page not found.</p>')
    expect(detectSoft404(h, 404, 5)).toBe(false)
  })

  it('returns false for 503 status code', () => {
    const h = soft404Html('Service Unavailable', '<p>The page cannot be found right now.</p>')
    expect(detectSoft404(h, 503, 8)).toBe(false)
  })

  // --- Edge cases ---

  it('does not flag empty body (no pattern to match)', () => {
    expect(detectSoft404('<html><head><title>Test</title></head><body></body></html>', 200, 0)).toBe(false)
  })

  it('does not flag page with no title tag', () => {
    expect(detectSoft404('<html><head></head><body><p>Page not found</p></body></html>', 200, 3)).toBe(true)
  })

  it('does not flag page at exactly 100 words with pattern in body', () => {
    const h = soft404Html('Site', `<p>Page not found. ${filler(98)}</p>`)
    expect(detectSoft404(h, 200, 100)).toBe(false)
  })

  it('flags page at 99 words with pattern in body', () => {
    const h = soft404Html('Site', `<p>Page not found. ${filler(96)}</p>`)
    expect(detectSoft404(h, 200, 99)).toBe(true)
  })
})
