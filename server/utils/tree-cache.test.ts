import { describe, it, expect } from 'vitest'
import { treeCacheVersion } from './tree-cache'

describe('treeCacheVersion — clé d\'invalidation du cache tree', () => {
  it('prend le max de lastCrawlAt et pagesUpdatedAt', () => {
    const crawl = new Date('2026-06-01T10:00:00Z')
    const discovery = new Date('2026-06-01T12:00:00Z')
    expect(treeCacheVersion({ lastCrawlAt: crawl, pagesUpdatedAt: discovery })).toBe(discovery.getTime())
    expect(treeCacheVersion({ lastCrawlAt: discovery, pagesUpdatedAt: crawl })).toBe(discovery.getTime())
  })

  it('gère un seul champ présent', () => {
    const d = new Date('2026-06-01T10:00:00Z')
    expect(treeCacheVersion({ lastCrawlAt: d })).toBe(d.getTime())
    expect(treeCacheVersion({ pagesUpdatedAt: d })).toBe(d.getTime())
  })

  it('renvoie 0 quand aucun champ (site jamais crawlé ni découvert)', () => {
    expect(treeCacheVersion({})).toBe(0)
    expect(treeCacheVersion({ lastCrawlAt: null, pagesUpdatedAt: null })).toBe(0)
  })

  it('change quand la discovery bump pagesUpdatedAt (busting du cache sur site frais)', () => {
    const before = treeCacheVersion({}) // site fraîchement ajouté, 0
    const after = treeCacheVersion({ pagesUpdatedAt: new Date('2026-06-01T10:44:00Z') })
    expect(after).not.toBe(before)
    expect(after).toBeGreaterThan(before)
  })
})
