import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockSubscriptionFindOne = vi.fn()
const mockSubscriptionUpdateOne = vi.fn()
const mockUserFindById = vi.fn()
const mockCustomersCreate = vi.fn()
const mockCheckoutSessionsCreate = vi.fn()

vi.mock('../../database/models', () => ({
  Subscription: {
    findOne: (...args: unknown[]) => ({ lean: () => mockSubscriptionFindOne(...args) }),
    updateOne: (...args: unknown[]) => mockSubscriptionUpdateOne(...args),
  },
  User: {
    findById: (...args: unknown[]) => ({ lean: () => mockUserFindById(...args) }),
  },
}))

vi.mock('../../utils/stripe', () => ({
  getStripe: () => ({
    customers: { create: (...args: unknown[]) => mockCustomersCreate(...args) },
    checkout: { sessions: { create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args) } },
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
vi.stubGlobal('getOrgIdFromHeader', vi.fn(() => 'org456'))
vi.stubGlobal('requireOrgRole', vi.fn())
vi.stubGlobal('useRequestLog', vi.fn(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})))

const futureDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000) // 9 days from now
const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)   // yesterday

describe('subscribe.post — trial_end handling', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.STRIPE_PRICE_METERED = 'price_test_123'
    process.env.NUXT_PUBLIC_APP_URL = 'https://test.seogard.io'

    mockSubscriptionFindOne.mockResolvedValue({
      _id: 'sub1',
      orgId: 'org456',
      stripeCustomerId: 'cus_existing',
    })
    mockCheckoutSessionsCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    })

    vi.resetModules()
    const mod = await import('./subscribe.post')
    handler = mod.default
  })

  it('passes trial_end to Stripe when user has remaining trial', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: futureDate })

    await handler(fakeEvent)

    const sessionArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(sessionArgs.subscription_data).toBeDefined()
    expect(sessionArgs.subscription_data.trial_end).toBe(
      Math.floor(futureDate.getTime() / 1000),
    )
  })

  it('does NOT pass trial_end when trial has expired', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: pastDate })

    await handler(fakeEvent)

    const sessionArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(sessionArgs.subscription_data).toBeUndefined()
  })

  it('does NOT pass trial_end when user has no trialEndsAt', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: null })

    await handler(fakeEvent)

    const sessionArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(sessionArgs.subscription_data).toBeUndefined()
  })

  it('creates Stripe customer when none exists', async () => {
    mockSubscriptionFindOne.mockResolvedValue({
      _id: 'sub1',
      orgId: 'org456',
      stripeCustomerId: null,
    })
    mockUserFindById.mockResolvedValue({ _id: 'user123', email: 'test@example.com', trialEndsAt: null })
    mockCustomersCreate.mockResolvedValue({ id: 'cus_new_123' })

    await handler(fakeEvent)

    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: 'test@example.com',
      metadata: { userId: 'user123', orgId: 'org456' },
    })
    expect(mockSubscriptionUpdateOne).toHaveBeenCalledWith(
      { orgId: 'org456' },
      { stripeCustomerId: 'cus_new_123' },
    )
  })

  it('reuses existing Stripe customer and does NOT create a new one', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user123', email: 'test@example.com', trialEndsAt: null })

    await handler(fakeEvent)

    // stripeCustomerId is already 'cus_existing' in beforeEach mock
    expect(mockCustomersCreate).not.toHaveBeenCalled()
    expect(mockSubscriptionUpdateOne).not.toHaveBeenCalled()
    const sessionArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(sessionArgs.customer).toBe('cus_existing')
  })

  it('returns the checkout session URL', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: null })

    const result = await handler(fakeEvent)

    expect(result).toEqual({ url: 'https://checkout.stripe.com/test' })
  })

  it('throws 404 when subscription not found', async () => {
    mockSubscriptionFindOne.mockResolvedValue(null)
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: null })

    await expect(handler(fakeEvent)).rejects.toThrow('Subscription not found')
  })

  it('throws 404 when user not found', async () => {
    mockUserFindById.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('User not found')
  })

  it('does NOT pass trial_end when trial expires within 48h', async () => {
    const within48h = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h from now
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: within48h })

    await handler(fakeEvent)

    const sessionArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(sessionArgs.subscription_data).toBeUndefined()
  })

  it('uses correct success and cancel URLs', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: null })

    await handler(fakeEvent)

    const sessionArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(sessionArgs.success_url).toBe(
      'https://test.seogard.io/dashboard/organizations/org456/billing?checkout=success',
    )
    expect(sessionArgs.cancel_url).toBe(
      'https://test.seogard.io/dashboard/organizations/org456/billing?checkout=cancel',
    )
  })

  it('passes priceId from env to Stripe', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: null })

    await handler(fakeEvent)

    const sessionArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
    expect(sessionArgs.line_items).toEqual([{ price: 'price_test_123' }])
  })

  it('throws 500 when STRIPE_PRICE_METERED is not set', async () => {
    delete process.env.STRIPE_PRICE_METERED
    vi.resetModules()
    const mod = await import('./subscribe.post')
    const freshHandler = mod.default

    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: null })

    await expect(freshHandler(fakeEvent)).rejects.toThrow('STRIPE_PRICE_METERED not configured')
  })

  it('re-throws Stripe errors with original status code', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user123', trialEndsAt: null })
    mockCheckoutSessionsCreate.mockRejectedValue(
      Object.assign(new Error('Card declined'), { statusCode: 402 }),
    )

    try {
      await handler(fakeEvent)
      expect.fail('should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(402)
      expect(err.message).toBe('Card declined')
    }
  })
})
