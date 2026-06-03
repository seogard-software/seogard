import { describe, it, expect } from 'vitest'
import { categorySlug, buildBreadcrumbJsonLd, paginationWindow } from './blog'

describe('categorySlug', () => {
  it('met en minuscules et remplace les espaces par des tirets', () => {
    expect(categorySlug('Meta Tags')).toBe('meta-tags')
  })

  it('retire les accents (NFD)', () => {
    expect(categorySlug('Référencement')).toBe('referencement')
    expect(categorySlug('Indexation génÉrale')).toBe('indexation-generale')
  })

  it('remplace ponctuation et symboles par des tirets, sans doublon', () => {
    expect(categorySlug('SSR & CSR')).toBe('ssr-csr')
    expect(categorySlug('Core Web Vitals / Perf')).toBe('core-web-vitals-perf')
  })

  it('ne laisse pas de tiret en début ni en fin', () => {
    expect(categorySlug('  GEO  ')).toBe('geo')
    expect(categorySlug('!Technique!')).toBe('technique')
  })

  it('est déterministe (même entrée → même slug)', () => {
    expect(categorySlug('Open Graph')).toBe(categorySlug('Open Graph'))
  })

  it('deux catégories proches peuvent collisionner (documenté) — slugs identiques', () => {
    expect(categorySlug('SEO Technique')).toBe('seo-technique')
    expect(categorySlug('SEO  technique')).toBe('seo-technique')
  })
})

describe('paginationWindow', () => {
  it('retourne [] si 0 ou 1 page (rien à paginer)', () => {
    expect(paginationWindow(1, 1)).toEqual([])
    expect(paginationWindow(1, 0)).toEqual([])
  })

  it('liste compacte sans ellipse quand peu de pages', () => {
    expect(paginationWindow(2, 4)).toEqual([1, 2, 3, 4])
  })

  it('insère des ellipses autour de la page courante', () => {
    expect(paginationWindow(12, 23)).toEqual([1, 'ellipsis', 11, 12, 13, 'ellipsis', 23])
  })

  it('pas d\'ellipse parasite près des bornes', () => {
    expect(paginationWindow(1, 23)).toEqual([1, 2, 'ellipsis', 23])
    expect(paginationWindow(23, 23)).toEqual([1, 'ellipsis', 22, 23])
  })

  it('toujours la première et la dernière page', () => {
    const w = paginationWindow(10, 50)
    expect(w[0]).toBe(1)
    expect(w[w.length - 1]).toBe(50)
  })
})

describe('buildBreadcrumbJsonLd', () => {
  it('produit un BreadcrumbList valide avec positions 1..n', () => {
    const jsonLd = buildBreadcrumbJsonLd([
      { name: 'Accueil', url: 'https://seogard.io/' },
      { name: 'Blog', url: 'https://seogard.io/blog' },
      { name: 'Mon article', url: 'https://seogard.io/blog/mon-article' },
    ])
    expect(jsonLd['@type']).toBe('BreadcrumbList')
    const items = jsonLd.itemListElement as Array<Record<string, unknown>>
    expect(items).toHaveLength(3)
    expect(items[0]).toMatchObject({ '@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': 'https://seogard.io/' })
    expect(items[2]).toMatchObject({ position: 3, name: 'Mon article', item: 'https://seogard.io/blog/mon-article' })
  })

  it('gère une liste vide', () => {
    const jsonLd = buildBreadcrumbJsonLd([])
    expect(jsonLd.itemListElement).toEqual([])
  })
})
