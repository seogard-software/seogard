import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockSubscriptionFindOne = vi.fn()
const mockCrawlCreate = vi.fn()
const mockZoneFindOne = vi.fn()
const mockRequireSiteAccess = vi.fn()
const mockUserFindById = vi.fn()

vi.mock('../../../database/models', () => ({
  Subscription: {
    findOne: (...args: unknown[]) => ({ lean: () => mockSubscriptionFindOne(...args) }),
  },
  Site: {},
  Crawl: {
    create: (...args: unknown[]) => mockCrawlCreate(...args),
  },
  Zone: {
    findOne: (...args: unknown[]) => ({ lean: () => mockZoneFindOne(...args) }),
  },
  User: {
    findById: (...args: unknown[]) => ({ select: () => ({ lean: () => mockUserFindById(...args) }) }),
  },
}))

vi.mock('../../../../shared/utils/pricing', async () => {
  const actual = await vi.importActual<typeof import('../../../../shared/utils/pricing')>('../../../../shared/utils/pricing')
  return actual
})

const mockIsSelfHosted = vi.fn(() => false)
vi.mock('../../../utils/deployment', () => ({
  isSelfHosted: () => mockIsSelfHosted(),
}))

// Stub Nuxt auto-imports
vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireValidId', vi.fn(() => 'site456'))
vi.stubGlobal('requireSiteAccess', mockRequireSiteAccess)
vi.stubGlobal('requireAuth', vi.fn(() => 'user123'))
vi.stubGlobal('useRequestLog', vi.fn(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})))

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)

describe('crawl.post handler — subscription guard', () => {
  let handler: Function
  const fakeEvent = {} as any
  const fakeSite = { _id: 'site456', name: 'Mon site', orgId: 'org123' }

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRequireSiteAccess.mockResolvedValue({ site: fakeSite, role: 'member' })
    mockZoneFindOne.mockResolvedValue({ _id: 'zone-default', isDefault: true })
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: futureDate })
    const mod = await import('./crawl.post')
    handler = mod.default
  })

  it('allows crawl when user has active subscription', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ _id: 'sub1', stripeStatus: 'active' })
    mockCrawlCreate.mockResolvedValue({ _id: 'crawl1', siteId: 'site456', status: 'pending' })

    const result = await handler(fakeEvent)

    expect(result).toEqual({ _id: 'crawl1', siteId: 'site456', status: 'pending' })
    expect(mockSubscriptionFindOne).toHaveBeenCalledWith({ orgId: 'org123' })
  })

  it('allows crawl when user has past_due subscription', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ _id: 'sub1', stripeStatus: 'past_due' })
    mockCrawlCreate.mockResolvedValue({ _id: 'crawl1', siteId: 'site456', status: 'pending' })

    const result = await handler(fakeEvent)

    expect(result._id).toBe('crawl1')
  })

  it('allows crawl for trialing user with active trial', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ _id: 'sub1', stripeStatus: 'trialing' })
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: futureDate })
    mockCrawlCreate.mockResolvedValue({ _id: 'crawl1', siteId: 'site456', status: 'pending' })

    const result = await handler(fakeEvent)

    expect(result._id).toBe('crawl1')
  })

  it('blocks crawl when trial has expired', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ _id: 'sub1', stripeStatus: 'trialing' })
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: pastDate })

    await expect(handler(fakeEvent)).rejects.toThrow('essai de 14 jours')
  })

  it('blocks crawl when subscription is canceled', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ _id: 'sub1', stripeStatus: 'canceled' })

    await expect(handler(fakeEvent)).rejects.toThrow('essai de 14 jours')
  })

  it('blocks crawl when subscription is unpaid', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ _id: 'sub1', stripeStatus: 'unpaid' })

    await expect(handler(fakeEvent)).rejects.toThrow('essai de 14 jours')
  })

  it('blocks crawl when no subscription found', async () => {
    mockSubscriptionFindOne.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('essai de 14 jours')
  })
})

describe('crawl.post handler — self-hosted mode', () => {
  let handler: Function
  const fakeEvent = {} as any
  const fakeSite = { _id: 'site456', name: 'Mon site', orgId: 'org123' }

  beforeEach(async () => {
    vi.clearAllMocks()
    mockIsSelfHosted.mockReturnValue(true)
    mockRequireSiteAccess.mockResolvedValue({ site: fakeSite, role: 'member' })
    mockZoneFindOne.mockResolvedValue({ _id: 'zone-default', isDefault: true })
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: null })
    const mod = await import('./crawl.post')
    handler = mod.default
  })

  it('allows crawl without any subscription in self-hosted mode', async () => {
    mockSubscriptionFindOne.mockResolvedValue(null)
    mockCrawlCreate.mockResolvedValue({ _id: 'crawl1', siteId: 'site456', status: 'pending' })

    const result = await handler(fakeEvent)

    expect(result._id).toBe('crawl1')
    expect(mockSubscriptionFindOne).not.toHaveBeenCalled()
  })

  it('allows crawl with expired trial in self-hosted mode', async () => {
    mockCrawlCreate.mockResolvedValue({ _id: 'crawl1', siteId: 'site456', status: 'pending' })

    const result = await handler(fakeEvent)

    expect(result._id).toBe('crawl1')
  })
})
