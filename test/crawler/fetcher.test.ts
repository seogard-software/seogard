import { describe, it, expect } from 'vitest'
import {
  extractAllHeadings,
  extractLinks,
  extractAllImages,
  extractSemanticStructure,
  extractFavicon,
  extractMetaByName,
  extractMetaByProperty,
  getGooglebotDisallows,
  isDisallowedInRobotsTxt,
} from '../../crawler/fetcher'
import { normalizeForCompare } from '../../crawler/rules/helpers'

// ============================================================
// Robustesse aux guillemets : une valeur en "..." peut contenir une apostrophe
// (et inversement). Régression historique : la description SSR était tronquée à
// la 1re apostrophe (« robot d » au lieu de « robot d'analyse… ») → faux positif
// ssr_meta_description_mismatch.
// ============================================================

describe('extraction d\'attributs — apostrophe dans une valeur entre guillemets doubles', () => {
  it('meta description : ne tronque PAS à l\'apostrophe', () => {
    const html = `<meta name="description" content="Notre robot d'analyse SEO technique. Guide pour Cloudflare, Akamai et autres pare-feu.">`
    expect(extractMetaByName(html, 'description')).toBe("Notre robot d'analyse SEO technique. Guide pour Cloudflare, Akamai et autres pare-feu.")
  })

  it('meta description : ordre content-puis-name', () => {
    const html = `<meta content="L'outil qui détecte les régressions" name="description">`
    expect(extractMetaByName(html, 'description')).toBe("L'outil qui détecte les régressions")
  })

  it('og:description : apostrophe préservée', () => {
    const html = `<meta property="og:description" content="Détectez l'instant où votre SEO casse.">`
    expect(extractMetaByProperty(html, 'og:description')).toBe("Détectez l'instant où votre SEO casse.")
  })

  it('valeur en simple quote contenant un guillemet double', () => {
    const html = `<meta name="description" content='Il a dit "bonjour" puis est parti'>`
    expect(extractMetaByName(html, 'description')).toBe('Il a dit "bonjour" puis est parti')
  })

  it('alt d\'image : apostrophe préservée', () => {
    const { images } = extractAllImages(`<img src="/p.jpg" alt="Photo d'un coucher de soleil">`)
    expect(images[0]?.alt).toBe("Photo d'un coucher de soleil")
  })

  it('valeur absente → null (inchangé)', () => {
    expect(extractMetaByName('<meta name="robots" content="index">', 'description')).toBeNull()
  })
})

describe('extraction d\'attributs — cas tordus (guillemets / apostrophes / entités)', () => {
  it('1. plusieurs apostrophes dans une valeur en guillemets doubles', () => {
    const html = `<meta name="description" content="l'outil d'analyse qu'on a conçu pour l'équipe">`
    expect(extractMetaByName(html, 'description')).toBe("l'outil d'analyse qu'on a conçu pour l'équipe")
  })

  it('2. apostrophe collée juste avant le guillemet fermant', () => {
    expect(extractMetaByName(`<meta name="description" content="c'est fini'">`, 'description')).toBe("c'est fini'")
  })

  it('3. apostrophe en tout début de valeur', () => {
    expect(extractMetaByName(`<meta name="description" content="'tis la saison des soldes">`, 'description')).toBe("'tis la saison des soldes")
  })

  it('4. valeur en simple quote contenant plusieurs guillemets doubles', () => {
    expect(extractMetaByName(`<meta name="description" content='il a dit "a" puis "b" puis "c"'>`, 'description')).toBe('il a dit "a" puis "b" puis "c"')
  })

  it('5. valeur vide → "" (présente, pas null)', () => {
    expect(extractMetaByName(`<meta name="description" content="">`, 'description')).toBe('')
  })

  it('6. entité &#39; conservée BRUTE par l\'extraction (décodée plus tard par normalizeForCompare)', () => {
    expect(extractMetaByName(`<meta name="description" content="l&#39;outil d&#39;analyse">`, 'description')).toBe('l&#39;outil d&#39;analyse')
  })

  it('7. entité &amp; conservée brute', () => {
    expect(extractMetaByName(`<meta name="description" content="Tom &amp; Jerry & Cie">`, 'description')).toBe('Tom &amp; Jerry & Cie')
  })

  it('8. PAS de débordement sur l\'attribut suivant (lazy s\'arrête au bon guillemet)', () => {
    const html = `<meta name="description" content="a'b'c" data-foo="ne doit PAS être capturé">`
    expect(extractMetaByName(html, 'description')).toBe("a'b'c")
  })

  it('9. ordre inversé content-puis-name, avec apostrophes', () => {
    expect(extractMetaByName(`<meta content="d'eau pure qu'on aime" name="description">`, 'description')).toBe("d'eau pure qu'on aime")
  })

  it('10. og:description (property) avec apostrophes', () => {
    expect(extractMetaByProperty(`<meta property="og:description" content="qu'il s'agit d'un test">`, 'og:description')).toBe("qu'il s'agit d'un test")
  })

  it('11. og:title (property) en simple quote avec guillemets doubles', () => {
    expect(extractMetaByProperty(`<meta property="og:title" content='Le "meilleur" outil'>`, 'og:title')).toBe('Le "meilleur" outil')
  })

  it('12. alt d\'image avec plusieurs apostrophes', () => {
    const { images } = extractAllImages(`<img src="/x.jpg" alt="photo d'un coucher qu'on adore">`)
    expect(images[0]?.alt).toBe("photo d'un coucher qu'on adore")
  })

  it('13. valeur sur plusieurs lignes (retour ligne dans le contenu)', () => {
    const html = `<meta name="description" content="ligne un\nligne deux d'affilée">`
    expect(extractMetaByName(html, 'description')).toBe("ligne un\nligne deux d'affilée")
  })

  it('round-trip anti-faux-positif : extraction brute (entité) PUIS normalizeForCompare == valeur décodée', () => {
    const ssrRaw = extractMetaByName(`<meta name="description" content="l&#39;outil &amp; l&#39;équipe">`, 'description')
    const csrDom = "l'outil & l'équipe" // ce que renvoie le DOM (déjà décodé)
    expect(ssrRaw).toBe('l&#39;outil &amp; l&#39;équipe')
    expect(normalizeForCompare(ssrRaw!)).toBe(normalizeForCompare(csrDom)) // pas de mismatch
  })
})

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

  it('keeps empty headings (needed to detect SSR-empty H1 hydrated by JS)', () => {
    const html = '<h1></h1><h2>   </h2><h3>Real</h3>'
    const result = extractAllHeadings(html)
    // Empty headings are kept with text=''. Whitespace-only is also normalized to ''.
    expect(result).toEqual([
      { level: 1, text: '' },
      { level: 2, text: '' },
      { level: 3, text: 'Real' },
    ])
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

describe('getGooglebotDisallows', () => {
  it('Disallow: / sous User-agent: * → ["/"]', () => {
    expect(getGooglebotDisallows('User-agent: *\nDisallow: /')).toEqual(['/'])
  })

  it('Disallow sous User-agent: Googlebot → chemins du groupe Googlebot', () => {
    expect(getGooglebotDisallows('User-agent: Googlebot\nDisallow: /private\nDisallow: /admin')).toEqual(['/private', '/admin'])
  })

  it('aucun blocage → []', () => {
    expect(getGooglebotDisallows('User-agent: *\nDisallow:')).toEqual([])
    expect(getGooglebotDisallows('User-agent: *\nAllow: /')).toEqual([])
    expect(getGooglebotDisallows('')).toEqual([])
  })

  it('précédence : groupe Googlebot dédié l\'emporte sur * (évite le faux positif)', () => {
    // * bloque tout, mais Googlebot a son propre groupe qui autorise → Googlebot n'est PAS bloqué.
    const robots = 'User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nDisallow:'
    expect(getGooglebotDisallows(robots)).toEqual([])
  })

  it('précédence : groupe Googlebot avec ses propres Disallow', () => {
    const robots = 'User-agent: *\nDisallow: /tout\n\nUser-agent: Googlebot\nDisallow: /interdit-google'
    expect(getGooglebotDisallows(robots)).toEqual(['/interdit-google'])
  })

  it('ignore les commentaires et tolère la casse', () => {
    const robots = '# commentaire\nUSER-AGENT: *\nDISALLOW: /x # inline\n'
    expect(getGooglebotDisallows(robots)).toEqual(['/x'])
  })

  it('groupe multi-agents (Googlebot listé avec d\'autres)', () => {
    const robots = 'User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /shared'
    expect(getGooglebotDisallows(robots)).toEqual(['/shared'])
  })

  it('dédoublonne les chemins répétés', () => {
    expect(getGooglebotDisallows('User-agent: *\nDisallow: /a\nDisallow: /a')).toEqual(['/a'])
  })

  it('Allow seul (sans Disallow) → []', () => {
    expect(getGooglebotDisallows('User-agent: Googlebot\nAllow: /public')).toEqual([])
  })
})

describe('isDisallowedInRobotsTxt (crawlers IA — blocage complet)', () => {
  it('crawler entièrement bloqué via son propre groupe → true', () => {
    expect(isDisallowedInRobotsTxt('User-agent: GPTBot\nDisallow: /', 'GPTBot')).toBe(true)
  })

  it('crawler bloqué via le groupe * → true', () => {
    expect(isDisallowedInRobotsTxt('User-agent: *\nDisallow: /', 'GPTBot')).toBe(true)
  })

  it('blocage partiel (chemin précis, pas /) → false (on ne flag que le blocage complet)', () => {
    expect(isDisallowedInRobotsTxt('User-agent: GPTBot\nDisallow: /private', 'GPTBot')).toBe(false)
  })

  it('non bloqué → false', () => {
    expect(isDisallowedInRobotsTxt('User-agent: *\nDisallow:', 'GPTBot')).toBe(false)
    expect(isDisallowedInRobotsTxt('', 'GPTBot')).toBe(false)
  })

  it('groupe multi-agents (le crawler listé avec d\'autres) → true', () => {
    expect(isDisallowedInRobotsTxt('User-agent: ClaudeBot\nUser-agent: GPTBot\nDisallow: /', 'GPTBot')).toBe(true)
  })

  it('Disallow: /* compte aussi comme blocage complet', () => {
    expect(isDisallowedInRobotsTxt('User-agent: *\nDisallow: /*', 'CCBot')).toBe(true)
  })

  it('précédence : un groupe dédié qui autorise l\'emporte sur un * bloquant (évite le faux positif)', () => {
    const robots = 'User-agent: *\nDisallow: /\n\nUser-agent: OAI-SearchBot\nDisallow:'
    expect(isDisallowedInRobotsTxt(robots, 'OAI-SearchBot')).toBe(false) // groupe dédié autorise → ignore *
    expect(isDisallowedInRobotsTxt(robots, 'PerplexityBot')).toBe(true) // pas de groupe dédié → subit *
  })
})
