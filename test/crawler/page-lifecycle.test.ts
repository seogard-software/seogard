import { describe, it, expect } from 'vitest'
import { PURGE_GONE_AFTER_DAYS, purgeCutoff, purgeableFilter } from '../../crawler/page-lifecycle'

const NOW = new Date('2026-07-02T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const SITE_ID = '6a1ef05ec20ff3b4905af891'

// Applique le filtre Mongo à une page en mémoire (miroir exact des conditions du filtre —
// si le filtre change, ces tests doivent changer avec lui).
function matches(page: { lastStatusCode: number | null, outOfSitemapSince: Date | null }, now: Date): boolean {
  const filter = purgeableFilter(SITE_ID, now) as { lastStatusCode: number, outOfSitemapSince: { $lte: Date } }
  return page.lastStatusCode === filter.lastStatusCode
    && page.outOfSitemapSince !== null
    && page.outOfSitemapSince.getTime() <= filter.outOfSitemapSince.$lte.getTime()
}

describe('purge des retraits digérés — 410 + hors sitemap ≥ 60 jours', () => {
  it('la fenêtre est de 60 jours (seuil unique, jamais dupliqué)', () => {
    expect(PURGE_GONE_AFTER_DAYS).toBe(60)
    expect(purgeCutoff(NOW).getTime()).toBe(NOW.getTime() - 60 * DAY)
  })

  it('purgeable : 410 sorti du sitemap depuis 61 jours', () => {
    expect(matches({ lastStatusCode: 410, outOfSitemapSince: new Date(NOW.getTime() - 61 * DAY) }, NOW)).toBe(true)
  })

  it('purgeable : pile à la borne (60 jours exactement)', () => {
    expect(matches({ lastStatusCode: 410, outOfSitemapSince: new Date(NOW.getTime() - 60 * DAY) }, NOW)).toBe(true)
  })

  it('PAS purgeable : sorti depuis seulement 59 jours (fenêtre de digestion en cours)', () => {
    expect(matches({ lastStatusCode: 410, outOfSitemapSince: new Date(NOW.getTime() - 59 * DAY) }, NOW)).toBe(false)
  })

  it('PAS purgeable : 404 nu, même très ancien (jamais un état terminal)', () => {
    expect(matches({ lastStatusCode: 404, outOfSitemapSince: new Date(NOW.getTime() - 200 * DAY) }, NOW)).toBe(false)
  })

  it('PAS purgeable : 301, même très ancien (watch redirect_broken à vie)', () => {
    expect(matches({ lastStatusCode: 301, outOfSitemapSince: new Date(NOW.getTime() - 200 * DAY) }, NOW)).toBe(false)
  })

  it('PAS purgeable : 200 hors sitemap (vivante = surveillée), ni 410 encore au sitemap', () => {
    expect(matches({ lastStatusCode: 200, outOfSitemapSince: new Date(NOW.getTime() - 200 * DAY) }, NOW)).toBe(false)
    expect(matches({ lastStatusCode: 410, outOfSitemapSince: null }, NOW)).toBe(false)
  })

  it('le filtre scope par siteId (jamais une purge cross-site)', () => {
    const filter = purgeableFilter(SITE_ID, NOW) as { siteId: { toString(): string } }
    expect(filter.siteId.toString()).toBe(SITE_ID)
  })
})
