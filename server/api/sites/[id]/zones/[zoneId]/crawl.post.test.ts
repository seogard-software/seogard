import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSubscriptionFindOne = vi.fn()
const mockZoneFindOne = vi.fn()
const mockUserFindById = vi.fn()
const mockOrgFindById = vi.fn()
const mockCrawlUpdateMany = vi.fn()
const mockRequireZoneCrawlAccess = vi.fn()
const mockTriggerSiteCrawl = vi.fn()
const mockIsSelfHosted = vi.fn(() => false)

vi.mock('~~/server/database/models', () => ({
  Subscription: { findOne: (...a: unknown[]) => ({ lean: () => mockSubscriptionFindOne(...a) }) },
  Zone: { findOne: (...a: unknown[]) => ({ lean: () => mockZoneFindOne(...a) }) },
  User: { findById: (...a: unknown[]) => ({ select: () => ({ lean: () => mockUserFindById(...a) }) }) },
  Organization: { findById: (...a: unknown[]) => ({ select: () => ({ lean: () => mockOrgFindById(...a) }) }) },
  Crawl: { updateMany: (...a: unknown[]) => mockCrawlUpdateMany(...a) },
}))
vi.mock('~~/shared/utils/pricing', async () => await vi.importActual('~~/shared/utils/pricing'))
vi.mock('~~/server/utils/deployment', () => ({ isSelfHosted: () => mockIsSelfHosted() }))
vi.mock('~~/server/utils/zone-ci-auth', () => ({ requireZoneCrawlAccess: (...a: unknown[]) => mockRequireZoneCrawlAccess(...a) }))
vi.mock('~~/server/utils/crawl-trigger', () => ({ triggerSiteCrawl: (...a: unknown[]) => mockTriggerSiteCrawl(...a) }))

vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number, message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireValidId', vi.fn(() => 'site456'))
vi.stubGlobal('getRouterParam', vi.fn(() => 'zone-x'))
vi.stubGlobal('useRequestLog', vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })))

const fakeSite = { _id: 'site456', orgId: 'org123' }
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
const fakeEvent = {} as any

describe('zone crawl.post — auth (clé/session) + garde abonnement + crawl de la zone', () => {
  let handler: Function
  beforeEach(async () => {
    vi.clearAllMocks()
    mockIsSelfHosted.mockReturnValue(false)
    mockRequireZoneCrawlAccess.mockResolvedValue({ site: fakeSite, viaApiKey: false })
    mockZoneFindOne.mockResolvedValue({ _id: 'zone-x', name: 'Blog' })
    mockUserFindById.mockResolvedValue({ trialEndsAt: futureDate })
    mockOrgFindById.mockResolvedValue({ ownerId: 'owner1' })
    mockTriggerSiteCrawl.mockResolvedValue({ _id: 'crawl1' })
    handler = (await import('./crawl.post')).default
  })

  it('session : crawl la zone, trigger manual', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ stripeStatus: 'active' })
    const result = await handler(fakeEvent)
    expect(result._id).toBe('crawl1')
    expect(mockTriggerSiteCrawl).toHaveBeenCalledWith('site456', 'zone-x', 'manual')
    expect(mockCrawlUpdateMany).not.toHaveBeenCalled() // pas de cancel-and-restart en manuel
  })

  it('clé API (CI) : trigger webhook + cancel-and-restart', async () => {
    mockRequireZoneCrawlAccess.mockResolvedValue({ site: fakeSite, viaApiKey: true })
    mockSubscriptionFindOne.mockResolvedValue({ stripeStatus: 'active' })
    await handler(fakeEvent)
    expect(mockTriggerSiteCrawl).toHaveBeenCalledWith('site456', 'zone-x', 'webhook')
    expect(mockCrawlUpdateMany).toHaveBeenCalled() // un deploy supersède le crawl en cours
  })

  it('404 si la zone est introuvable', async () => {
    mockZoneFindOne.mockResolvedValue(null)
    await expect(handler(fakeEvent)).rejects.toThrow('Zone introuvable')
  })

  it('bloque si essai (owner) expiré', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ stripeStatus: 'trialing' })
    mockUserFindById.mockResolvedValue({ trialEndsAt: pastDate })
    await expect(handler(fakeEvent)).rejects.toThrow('essai de 14 jours')
    expect(mockTriggerSiteCrawl).not.toHaveBeenCalled()
  })

  it('bloque si pas d\'abonnement', async () => {
    mockSubscriptionFindOne.mockResolvedValue(null)
    await expect(handler(fakeEvent)).rejects.toThrow('essai de 14 jours')
  })

  it('self-hosted : crawl autorisé sans abonnement', async () => {
    mockIsSelfHosted.mockReturnValue(true)
    const result = await handler(fakeEvent)
    expect(result._id).toBe('crawl1')
    expect(mockSubscriptionFindOne).not.toHaveBeenCalled()
  })
})
