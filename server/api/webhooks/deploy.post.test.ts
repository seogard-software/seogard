import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockSiteFindOne = vi.fn()
const mockSubscriptionFindOne = vi.fn()
const mockCrawlUpdateMany = vi.fn()
const mockCrawlCreate = vi.fn()
const mockOrganizationFindById = vi.fn()
const mockUserFindById = vi.fn()

vi.mock('../../database/models', () => ({
  Site: {
    findOne: (...args: unknown[]) => ({ select: () => ({ lean: () => mockSiteFindOne(...args) }) }),
  },
  Subscription: {
    findOne: (...args: unknown[]) => ({ lean: () => mockSubscriptionFindOne(...args) }),
  },
  Crawl: {
    updateMany: (...args: unknown[]) => mockCrawlUpdateMany(...args),
    create: (...args: unknown[]) => mockCrawlCreate(...args),
  },
  Organization: {
    findById: (...args: unknown[]) => ({ select: () => ({ lean: () => mockOrganizationFindById(...args) }) }),
  },
  User: {
    findById: (...args: unknown[]) => ({ select: () => ({ lean: () => mockUserFindById(...args) }) }),
  },
}))

vi.mock('../../../shared/utils/pricing', async () => {
  const actual = await vi.importActual<typeof import('../../../shared/utils/pricing')>('../../../shared/utils/pricing')
  return actual
})

const mockIsSelfHosted = vi.fn(() => false)
vi.mock('../../utils/deployment', () => ({
  isSelfHosted: () => mockIsSelfHosted(),
}))

// Stub Nuxt auto-imports
vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('getHeader', vi.fn())
vi.stubGlobal('useRequestLog', vi.fn(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})))

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)

describe('deploy.post webhook', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./deploy.post')
    handler = mod.default
  })

  it('returns 401 without x-api-key', async () => {
    ;(getHeader as any).mockReturnValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('API key requise')
  })

  it('returns 401 with invalid API key', async () => {
    ;(getHeader as any).mockReturnValue('bad-key')
    mockSiteFindOne.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('API key invalide')
  })

  it('returns 403 when subscription inactive', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1', name: 'Test', orgId: 'org1' })
    mockSubscriptionFindOne.mockResolvedValue({ stripeStatus: 'canceled' })

    await expect(handler(fakeEvent)).rejects.toThrow('Subscription inactive')
  })

  it('returns 403 when no subscription found', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1', name: 'Test', orgId: 'org1' })
    mockSubscriptionFindOne.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('Subscription inactive')
  })

  it('creates crawl when subscription is active', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1', name: 'Test', orgId: 'org1' })
    mockSubscriptionFindOne.mockResolvedValue({ stripeStatus: 'active' })
    mockCrawlUpdateMany.mockResolvedValue({})
    mockCrawlCreate.mockResolvedValue({ _id: 'crawl1' })

    const result = await handler(fakeEvent)

    expect(result.success).toBe(true)
    expect(result.crawlId).toBe('crawl1')
    expect(mockCrawlCreate).toHaveBeenCalledWith({
      siteId: 'site1',
      trigger: 'webhook',
      status: 'pending',
    })
  })

  it('cancels existing pending/running crawls before creating new one', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1', name: 'Test', orgId: 'org1' })
    mockSubscriptionFindOne.mockResolvedValue({ stripeStatus: 'active' })
    mockCrawlUpdateMany.mockResolvedValue({ modifiedCount: 2 })
    mockCrawlCreate.mockResolvedValue({ _id: 'crawl2' })

    await handler(fakeEvent)

    expect(mockCrawlUpdateMany).toHaveBeenCalledWith(
      { siteId: 'site1', status: { $in: ['pending', 'running'] } },
      { status: 'cancelled', error: 'Superseded by new deploy webhook' },
    )
  })

  it('allows trialing user with active trial', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1', name: 'Test', orgId: 'org1' })
    mockSubscriptionFindOne.mockResolvedValue({ _id: 'sub1', stripeStatus: 'trialing' })
    mockOrganizationFindById.mockResolvedValue({ _id: 'org1', ownerId: 'owner1' })
    mockUserFindById.mockResolvedValue({ _id: 'owner1', trialEndsAt: futureDate })
    mockCrawlUpdateMany.mockResolvedValue({})
    mockCrawlCreate.mockResolvedValue({ _id: 'crawl1' })

    const result = await handler(fakeEvent)

    expect(result.success).toBe(true)
  })

  it('blocks trialing user with expired trial', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1', name: 'Test', orgId: 'org1' })
    mockSubscriptionFindOne.mockResolvedValue({ _id: 'sub1', stripeStatus: 'trialing' })
    mockOrganizationFindById.mockResolvedValue({ _id: 'org1', ownerId: 'owner1' })
    mockUserFindById.mockResolvedValue({ _id: 'owner1', trialEndsAt: pastDate })

    await expect(handler(fakeEvent)).rejects.toThrow('Subscription inactive')
  })
})

describe('deploy.post webhook — self-hosted mode', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockIsSelfHosted.mockReturnValue(true)
    const mod = await import('./deploy.post')
    handler = mod.default
  })

  it('allows deploy without subscription in self-hosted mode', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1', name: 'Test', orgId: 'org1' })
    mockCrawlUpdateMany.mockResolvedValue({})
    mockCrawlCreate.mockResolvedValue({ _id: 'crawl1' })

    const result = await handler(fakeEvent)

    expect(result.success).toBe(true)
    expect(mockSubscriptionFindOne).not.toHaveBeenCalled()
  })

  it('allows deploy with canceled subscription in self-hosted mode', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1', name: 'Test', orgId: 'org1' })
    mockCrawlUpdateMany.mockResolvedValue({})
    mockCrawlCreate.mockResolvedValue({ _id: 'crawl1' })

    const result = await handler(fakeEvent)

    expect(result.success).toBe(true)
  })
})
