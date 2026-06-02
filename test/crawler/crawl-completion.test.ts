import { describe, it, expect, vi, beforeEach } from 'vitest'

// claimCrawlFinalization n'utilise que Crawl.findOneAndUpdate → mock minimal.
const findOneAndUpdate = vi.fn()
vi.mock('../../server/database/models', () => ({
  Crawl: { findOneAndUpdate: (...args: unknown[]) => findOneAndUpdate(...args) },
}))

const COUNTS = { scanned: 100, alerts: 5, blocked: 0, failed: 0 }

describe('isCrawlComplete — terminé = toutes les pages analysées (pas file vide)', () => {
  it('scanned ≥ total → true', async () => {
    const { isCrawlComplete } = await import('../../crawler/crawl-completion')
    expect(isCrawlComplete({ total: 100, scanned: 100 })).toBe(true)
    expect(isCrawlComplete({ total: 100, scanned: 101 })).toBe(true)
  })
  it('scanned < total → false (dernier batch encore en vol)', async () => {
    const { isCrawlComplete } = await import('../../crawler/crawl-completion')
    expect(isCrawlComplete({ total: 100, scanned: 99 })).toBe(false)
  })
  it('total 0 → false (rien à finaliser via ce chemin)', async () => {
    const { isCrawlComplete } = await import('../../crawler/crawl-completion')
    expect(isCrawlComplete({ total: 0, scanned: 0 })).toBe(false)
  })
})

describe('isCrawlStalled — watchdog crash worker', () => {
  const now = 1_000_000
  const STALE = 180_000 // 3 min
  const base = { total: 100, scanned: 80, dequeued: 100, lastProgressAt: now - STALE - 1 }

  it('pages dépilées + analyse figée sous le total depuis > staleMs → true', async () => {
    const { isCrawlStalled } = await import('../../crawler/crawl-completion')
    expect(isCrawlStalled(base, now, STALE)).toBe(true)
  })
  it('progression récente → false (pas figé)', async () => {
    const { isCrawlStalled } = await import('../../crawler/crawl-completion')
    expect(isCrawlStalled({ ...base, lastProgressAt: now - 1000 }, now, STALE)).toBe(false)
  })
  it('borne exacte (now - lastProgressAt === staleMs) → false (le seuil est strict)', async () => {
    const { isCrawlStalled } = await import('../../crawler/crawl-completion')
    expect(isCrawlStalled({ ...base, lastProgressAt: now - STALE }, now, STALE)).toBe(false)
  })
  it('toutes les pages analysées (scanned ≥ total) → false (flux normal, pas watchdog)', async () => {
    const { isCrawlStalled } = await import('../../crawler/crawl-completion')
    expect(isCrawlStalled({ ...base, scanned: 100 }, now, STALE)).toBe(false)
  })
  it('pages pas toutes dépilées (dequeued < total) → false', async () => {
    const { isCrawlStalled } = await import('../../crawler/crawl-completion')
    expect(isCrawlStalled({ ...base, dequeued: 90 }, now, STALE)).toBe(false)
  })
  it('lastProgressAt absent (0) → false (pas de base de temps fiable)', async () => {
    const { isCrawlStalled } = await import('../../crawler/crawl-completion')
    expect(isCrawlStalled({ ...base, lastProgressAt: 0 }, now, STALE)).toBe(false)
  })
})

describe('claimCrawlFinalization — exactly-once', () => {
  beforeEach(() => findOneAndUpdate.mockReset())

  it('1er appel : un doc est matché → true (ce worker finalise)', async () => {
    const { claimCrawlFinalization } = await import('../../crawler/crawl-completion')
    findOneAndUpdate.mockResolvedValueOnce({ _id: 'c1', status: 'completed' })
    expect(await claimCrawlFinalization('c1', COUNTS)).toBe(true)
  })

  it('claim filtré sur les statuts NON terminaux + pose completed et les compteurs', async () => {
    const { claimCrawlFinalization } = await import('../../crawler/crawl-completion')
    findOneAndUpdate.mockResolvedValueOnce({ _id: 'c1' })
    await claimCrawlFinalization('c1', COUNTS)
    const [filter, update] = findOneAndUpdate.mock.calls[0] as [Record<string, unknown>, { $set: Record<string, unknown> }]
    expect(filter).toEqual({ _id: 'c1', status: { $nin: ['completed', 'failed', 'cancelled'] } })
    expect(update.$set.status).toBe('completed')
    expect(update.$set.pagesScanned).toBe(100)
    expect(update.$set.alertsGenerated).toBe(5)
  })

  it('2e appel concurrent (déjà completed) : aucun doc matché → false (0 finalize, 0 mail)', async () => {
    const { claimCrawlFinalization } = await import('../../crawler/crawl-completion')
    findOneAndUpdate.mockResolvedValueOnce({ _id: 'c1' }).mockResolvedValue(null)
    expect(await claimCrawlFinalization('c1', COUNTS)).toBe(true)
    expect(await claimCrawlFinalization('c1', COUNTS)).toBe(false)
    expect(await claimCrawlFinalization('c1', COUNTS)).toBe(false)
  })

  it('crawl cancelled/failed : le filtre ne matche pas → false (cancel-and-restart sûr)', async () => {
    const { claimCrawlFinalization } = await import('../../crawler/crawl-completion')
    findOneAndUpdate.mockResolvedValue(null)
    expect(await claimCrawlFinalization('c1', COUNTS)).toBe(false)
  })
})
