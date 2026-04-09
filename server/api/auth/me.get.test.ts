import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockUserFindById = vi.fn()
const mockSubscriptionFindOne = vi.fn()
const mockSiteFind = vi.fn()
const mockMonitoredPageCountDocuments = vi.fn()
const mockOrgMemberFind = vi.fn()
const mockOrganizationFind = vi.fn()

vi.mock('../../database/models', () => ({
  User: {
    findById: (...args: unknown[]) => ({ select: () => ({ lean: () => mockUserFindById(...args) }) }),
  },
  Subscription: {
    findOne: (...args: unknown[]) => ({ lean: () => mockSubscriptionFindOne(...args) }),
  },
  Site: {
    find: (...args: unknown[]) => ({ select: () => ({ lean: () => mockSiteFind(...args) }) }),
  },
  MonitoredPage: {
    countDocuments: (...args: unknown[]) => mockMonitoredPageCountDocuments(...args),
  },
  OrgMember: {
    find: (...args: unknown[]) => ({ lean: () => mockOrgMemberFind(...args) }),
  },
  Organization: {
    find: (...args: unknown[]) => ({ select: () => ({ lean: () => mockOrganizationFind(...args) }) }),
  },
}))

// Stub Nuxt auto-imports
vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireAuth', vi.fn(() => 'user123'))
vi.stubGlobal('useRequestHeaders', vi.fn(() => ({})))
vi.stubGlobal('getHeader', vi.fn(() => null))

describe('/api/auth/me', () => {
  let handler: Function
  const fakeEvent = { context: { auth: { userId: 'user123' } } } as any

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  const fakeUser = { _id: 'user123', email: 'test@seogard.io', trialEndsAt }
  const fakeOrg = { _id: 'org123', name: 'Test Org', slug: 'org-user123' }
  const fakeMembership = { orgId: 'org123', userId: 'user123', role: 'owner' }

  beforeEach(async () => {
    vi.clearAllMocks()
    mockUserFindById.mockResolvedValue(fakeUser)
    mockOrgMemberFind.mockResolvedValue([fakeMembership])
    mockOrganizationFind.mockResolvedValue([fakeOrg])
    const mod = await import('./me.get')
    handler = mod.default
  })

  // --- Trial ---

  it('trial — returns trialEndsAt and totalPagesUsed', async () => {
    mockSubscriptionFindOne.mockResolvedValue({
      stripeStatus: 'trialing',
      stripeCustomerId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    })
    mockSiteFind.mockResolvedValue([])
    mockMonitoredPageCountDocuments.mockResolvedValue(0)

    const result = await handler(fakeEvent)

    expect(result.trialEndsAt).toEqual(trialEndsAt)
    expect(result.subscription.totalPagesUsed).toBe(0)
    expect(result.subscription).not.toHaveProperty('freeCrawlUsed')
    expect(result.subscription).not.toHaveProperty('pageLimit')
  })

  // --- Active ---

  it('active subscription — returns totalPagesUsed', async () => {
    mockSubscriptionFindOne.mockResolvedValue({
      stripeStatus: 'active',
      stripeCustomerId: 'cus_123',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    })
    mockSiteFind.mockResolvedValue([{ _id: 'site1' }])
    mockMonitoredPageCountDocuments.mockResolvedValue(25_000)

    const result = await handler(fakeEvent)

    expect(result.subscription.totalPagesUsed).toBe(25_000)
    expect(result.subscription.stripeStatus).toBe('active')
  })

  // --- Past due ---

  it('past_due — crawls still allowed', async () => {
    mockSubscriptionFindOne.mockResolvedValue({
      stripeStatus: 'past_due',
      stripeCustomerId: 'cus_456',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    })
    mockSiteFind.mockResolvedValue([{ _id: 'sA' }])
    mockMonitoredPageCountDocuments.mockResolvedValue(42_000)

    const result = await handler(fakeEvent)

    expect(result.subscription.totalPagesUsed).toBe(42_000)
    expect(result.subscription.stripeStatus).toBe('past_due')
  })

  // --- Edge cases ---

  it('no subscription returns null', async () => {
    mockSubscriptionFindOne.mockResolvedValue(null)
    mockSiteFind.mockResolvedValue([])
    mockMonitoredPageCountDocuments.mockResolvedValue(0)

    const result = await handler(fakeEvent)

    expect(result.subscription).toBeNull()
  })

  it('no sites: totalPagesUsed = 0, countDocuments not called', async () => {
    mockSubscriptionFindOne.mockResolvedValue({
      stripeStatus: 'active',
      stripeCustomerId: 'cus_empty',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    })
    mockSiteFind.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result.subscription.totalPagesUsed).toBe(0)
    expect(mockMonitoredPageCountDocuments).not.toHaveBeenCalled()
  })

  it('user not found = 404', async () => {
    mockUserFindById.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('Utilisateur non trouvé')
  })

  it('subscription response does not contain legacy fields', async () => {
    mockSubscriptionFindOne.mockResolvedValue({
      stripeStatus: 'active',
      stripeCustomerId: 'cus_x',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    })
    mockSiteFind.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result.subscription).not.toHaveProperty('planId')
    expect(result.subscription).not.toHaveProperty('billingInterval')
    expect(result.subscription).not.toHaveProperty('customPageLimit')
    expect(result.subscription).not.toHaveProperty('freeCrawlUsed')
    expect(result.subscription).not.toHaveProperty('pageLimit')
  })

  it('countDocuments filters by lastCheckedAt >= currentPeriodStart', async () => {
    const periodStart = new Date('2026-03-01T00:00:00Z')
    mockSubscriptionFindOne.mockResolvedValue({
      stripeStatus: 'active',
      stripeCustomerId: 'cus_multi',
      currentPeriodStart: periodStart,
      currentPeriodEnd: new Date(),
    })
    const siteIds = [{ _id: 'id1' }, { _id: 'id2' }, { _id: 'id3' }]
    mockSiteFind.mockResolvedValue(siteIds)
    mockMonitoredPageCountDocuments.mockResolvedValue(25_000)

    await handler(fakeEvent)

    expect(mockSiteFind).toHaveBeenCalledWith({ orgId: 'org123' })
    expect(mockMonitoredPageCountDocuments).toHaveBeenCalledWith({
      siteId: { $in: ['id1', 'id2', 'id3'] },
      lastCheckedAt: { $gte: periodStart },
    })
  })

  it('totalPagesUsed = 0 when no currentPeriodStart', async () => {
    mockSubscriptionFindOne.mockResolvedValue({
      stripeStatus: 'trialing',
      stripeCustomerId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    })
    mockSiteFind.mockResolvedValue([{ _id: 'site1' }])

    const result = await handler(fakeEvent)

    expect(result.subscription.totalPagesUsed).toBe(0)
    expect(mockMonitoredPageCountDocuments).not.toHaveBeenCalled()
  })
})
