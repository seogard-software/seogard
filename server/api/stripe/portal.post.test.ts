import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockSubscriptionFindOne = vi.fn()

vi.mock('../../database/models', () => ({
  Subscription: {
    findOne: (...args: unknown[]) => ({ lean: () => mockSubscriptionFindOne(...args) }),
  },
}))

const mockPortalCreate = vi.fn()

vi.mock('../../utils/stripe', () => ({
  getStripe: () => ({
    billingPortal: { sessions: { create: mockPortalCreate } },
  }),
}))

// Stub Nuxt auto-imports
vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireAuth', vi.fn(() => 'user123'))
vi.stubGlobal('getOrgIdFromHeader', vi.fn(() => 'org123'))
vi.stubGlobal('requireOrgRole', vi.fn(async () => ({ role: 'owner' })))
vi.stubGlobal('useRequestLog', vi.fn(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})))

describe('portal.post handler', () => {
  let handler: Function

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.NUXT_PUBLIC_APP_URL = 'https://app.seogard.io'
    const mod = await import('./portal.post')
    handler = mod.default
  })

  const fakeEvent = { context: { auth: { userId: 'user123' } } } as any

  it('creates a portal session and returns URL', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ stripeCustomerId: 'cus_123' })
    mockPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/portal123' })

    const result = await handler(fakeEvent)

    expect(result).toEqual({ url: 'https://billing.stripe.com/portal123' })
    expect(mockSubscriptionFindOne).toHaveBeenCalledWith({ orgId: 'org123' })
    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: 'cus_123',
      return_url: 'https://app.seogard.io/dashboard/organizations/org123/billing',
    })
  })

  it('throws 400 when no stripeCustomerId', async () => {
    mockSubscriptionFindOne.mockResolvedValue({ stripeCustomerId: null })

    await expect(handler(fakeEvent)).rejects.toThrow('No Stripe customer linked to this account')
  })

  it('throws 400 when subscription not found', async () => {
    mockSubscriptionFindOne.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('No Stripe customer linked to this account')
  })

  it('uses default URL when NUXT_PUBLIC_APP_URL is not set', async () => {
    delete process.env.NUXT_PUBLIC_APP_URL
    const mod = await import('./portal.post')
    const freshHandler = mod.default

    mockSubscriptionFindOne.mockResolvedValue({ stripeCustomerId: 'cus_123' })
    mockPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/portal123' })

    await freshHandler(fakeEvent)

    expect(mockPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: 'http://localhost:3000/dashboard/organizations/org123/billing',
      }),
    )
  })
})
