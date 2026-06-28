import { describe, it, expect } from 'vitest'
import { computeSitemapDiff, type SitemapPageSnapshot } from '../../crawler/sitemap-diff'

const D = new Date('2026-06-01')

function pages(...rows: Array<[string, Date | null]>): SitemapPageSnapshot[] {
  return rows.map(([url, outOfSitemapSince]) => ({ url, outOfSitemapSince }))
}

describe('computeSitemapDiff (marquage uniquement)', () => {
  it('marque les pages disparues (pas encore marquées)', () => {
    const existing = pages(
      ['https://x.com/a', null],
      ['https://x.com/b', null],
      ['https://x.com/c', null],
    )
    const diff = computeSitemapDiff(existing, ['https://x.com/a'])
    expect(diff.toMarkUrls.sort()).toEqual(['https://x.com/b', 'https://x.com/c'])
  })

  it('marque TOUTES les disparues, même une suppression massive (pas de seuil magique)', () => {
    const existing = pages(
      ['https://x.com/a', null],
      ['https://x.com/b', null],
      ['https://x.com/c', null],
      ['https://x.com/d', null],
    )
    const diff = computeSitemapDiff(existing, ['https://x.com/a']) // 3/4 disparues = 75%
    expect(diff.toMarkUrls.sort()).toEqual(['https://x.com/b', 'https://x.com/c', 'https://x.com/d'])
  })

  it('ne re-marque pas une page déjà hors-sitemap', () => {
    const existing = pages(
      ['https://x.com/a', null],
      ['https://x.com/b', D], // déjà marquée
    )
    const diff = computeSitemapDiff(existing, ['https://x.com/a'])
    expect(diff.toMarkUrls).toEqual([]) // b déjà marquée → rien à marquer
  })

  it('réintègre les pages revenues au sitemap (returnedUrls)', () => {
    const existing = pages(
      ['https://x.com/a', D], // était hors-sitemap
      ['https://x.com/b', null],
    )
    const diff = computeSitemapDiff(existing, ['https://x.com/a', 'https://x.com/b'])
    expect(diff.returnedUrls).toEqual(['https://x.com/a'])
    expect(diff.toMarkUrls).toEqual([])
  })

  it('aucun changement → rien à marquer ni réintégrer', () => {
    const existing = pages(['https://x.com/a', null])
    const diff = computeSitemapDiff(existing, ['https://x.com/a'])
    expect(diff.toMarkUrls).toEqual([])
    expect(diff.returnedUrls).toEqual([])
  })
})
