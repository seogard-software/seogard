import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockSubscriptionFindOneAndUpdate = vi.fn()
const mockSubscriptionFindOne = vi.fn()
const mockSubscriptionUpdateOne = vi.fn()
const mockPaymentCreate = vi.fn()
const mockSiteFind = vi.fn()
const mockMonitoredPageCountDocuments = vi.fn()
const mockUserFindById = vi.fn()
const mockSubscriptionsRetrieve = vi.fn()
const mockCreateUsageRecord = vi.fn()

vi.mock('../../database/models', () => ({
  Subscription: {
    findOneAndUpdate: (...args: unknown[]) => mockSubscriptionFindOneAndUpdate(...args),
    findOne: (...args: unknown[]) => ({ lean: () => mockSubscriptionFindOne(...args) }),
    updateOne: (...args: unknown[]) => mockSubscriptionUpdateOne(...args),
  },
  Payment: {
    create: (...args: unknown[]) => mockPaymentCreate(...args),
  },
  Site: {
    find: (...args: unknown[]) => ({ select: () => ({ lean: () => mockSiteFind(...args) }) }),
  },
  MonitoredPage: {
    countDocuments: (...args: unknown[]) => mockMonitoredPageCountDocuments(...args),
  },
  User: {
    findById: (...args: unknown[]) => ({ lean: () => mockUserFindById(...args) }),
  },
  Organization: {
    findById: (...args: unknown[]) => ({ lean: () => Promise.resolve({ ownerId: 'user123' }) }),
  },
}))

vi.mock('../../utils/stripe', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: (_body: string, _sig: string, _secret: string) => fakeStripeEvent,
    },
    subscriptions: {
      retrieve: (...args: unknown[]) => mockSubscriptionsRetrieve(...args),
    },
    subscriptionItems: {
      createUsageRecord: (...args: unknown[]) => mockCreateUsageRecord(...args),
    },
  }),
}))

vi.mock('../../utils/email', () => ({
  sendPaymentFailedEmail: vi.fn(),
}))

vi.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

// Stub Nuxt auto-imports
vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('readRawBody', vi.fn(() => '{}'))
vi.stubGlobal('getHeader', vi.fn(() => 'sig_test'))

let fakeStripeEvent: any = {}

describe('webhook.post — checkout.session.completed', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    mockSubscriptionFindOneAndUpdate.mockResolvedValue({ orgId: 'org456' })
    vi.resetModules()
  })

  it('sets stripeStatus to trialing when Stripe sub is trialing', async () => {
    fakeStripeEvent = {
      type: 'checkout.session.completed',
      id: 'evt_1',
      data: {
        object: {
          id: 'cs_1',
          customer: 'cus_123',
          subscription: 'sub_stripe_1',
        },
      },
    }
    mockSubscriptionsRetrieve.mockResolvedValue({ status: 'trialing', current_period_start: 1700000000, current_period_end: 1702600000 })

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { stripeCustomerId: 'cus_123' },
      {
        stripeSubscriptionId: 'sub_stripe_1',
        stripeStatus: 'trialing',
        currentPeriodStart: new Date(1700000000 * 1000),
        currentPeriodEnd: new Date(1702600000 * 1000),
      },
      { new: true },
    )
  })

  it('sets stripeStatus to active when Stripe sub is active (no trial)', async () => {
    fakeStripeEvent = {
      type: 'checkout.session.completed',
      id: 'evt_2',
      data: {
        object: {
          id: 'cs_2',
          customer: 'cus_123',
          subscription: 'sub_stripe_2',
        },
      },
    }
    mockSubscriptionsRetrieve.mockResolvedValue({ status: 'active', current_period_start: 1700000000, current_period_end: 1702600000 })

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { stripeCustomerId: 'cus_123' },
      {
        stripeSubscriptionId: 'sub_stripe_2',
        stripeStatus: 'active',
        currentPeriodStart: new Date(1700000000 * 1000),
        currentPeriodEnd: new Date(1702600000 * 1000),
      },
      { new: true },
    )
  })
})

describe('webhook.post — customer.subscription.updated', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    mockSubscriptionFindOneAndUpdate.mockResolvedValue({ orgId: 'org456' })
    vi.resetModules()
  })

  it('syncs status from trialing to active with period dates', async () => {
    fakeStripeEvent = {
      type: 'customer.subscription.updated',
      id: 'evt_3',
      data: {
        object: {
          id: 'sub_stripe_1',
          status: 'active',
          current_period_start: 1700000000,
          current_period_end: 1702600000,
        },
      },
    }

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { stripeSubscriptionId: 'sub_stripe_1' },
      {
        stripeStatus: 'active',
        currentPeriodStart: new Date(1700000000 * 1000),
        currentPeriodEnd: new Date(1702600000 * 1000),
      },
      { new: true },
    )
  })

  it('syncs status to past_due with period dates', async () => {
    fakeStripeEvent = {
      type: 'customer.subscription.updated',
      id: 'evt_4',
      data: {
        object: {
          id: 'sub_stripe_1',
          status: 'past_due',
          current_period_start: 1700000000,
          current_period_end: 1702600000,
        },
      },
    }

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { stripeSubscriptionId: 'sub_stripe_1' },
      {
        stripeStatus: 'past_due',
        currentPeriodStart: new Date(1700000000 * 1000),
        currentPeriodEnd: new Date(1702600000 * 1000),
      },
      { new: true },
    )
  })
})

describe('webhook.post — invoice.payment_succeeded', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    vi.resetModules()
  })

  it('creates Payment record and resets status to active', async () => {
    fakeStripeEvent = {
      type: 'invoice.payment_succeeded',
      id: 'evt_5',
      data: {
        object: {
          id: 'inv_1',
          customer: 'cus_123',
          subscription: 'sub_stripe_1',
          amount_paid: 4200,
          currency: 'eur',
          invoice_pdf: 'https://stripe.com/pdf',
          period_start: 1700000000,
          period_end: 1702600000,
        },
      },
    }

    mockSubscriptionFindOne.mockResolvedValue({
      _id: 'sub_db_1',
      orgId: 'org456',
      stripeStatus: 'past_due',
    })
    mockSiteFind.mockResolvedValue([{ _id: 'site1' }])
    mockMonitoredPageCountDocuments.mockResolvedValue(600)
    mockPaymentCreate.mockResolvedValue({})

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockPaymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'org456',
        amount: 4200,
        currency: 'eur',
        status: 'succeeded',
        pagesCount: 600,
      }),
    )
    // Should update status and period dates
    expect(mockSubscriptionUpdateOne).toHaveBeenCalledWith(
      { _id: 'sub_db_1' },
      {
        stripeStatus: 'active',
        currentPeriodStart: new Date(1700000000 * 1000),
        currentPeriodEnd: new Date(1702600000 * 1000),
      },
    )
  })

  it('updates period dates even when already active', async () => {
    fakeStripeEvent = {
      type: 'invoice.payment_succeeded',
      id: 'evt_5b',
      data: {
        object: {
          id: 'inv_2',
          customer: 'cus_123',
          subscription: 'sub_stripe_1',
          amount_paid: 4200,
          currency: 'eur',
          invoice_pdf: 'https://stripe.com/pdf',
          period_start: 1700000000,
          period_end: 1702600000,
        },
      },
    }

    mockSubscriptionFindOne.mockResolvedValue({
      _id: 'sub_db_1',
      orgId: 'org456',
      stripeStatus: 'active',
    })
    mockSiteFind.mockResolvedValue([{ _id: 'site1' }])
    mockMonitoredPageCountDocuments.mockResolvedValue(100)
    mockPaymentCreate.mockResolvedValue({})

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockPaymentCreate).toHaveBeenCalled()
    expect(mockSubscriptionUpdateOne).toHaveBeenCalledWith(
      { _id: 'sub_db_1' },
      {
        stripeStatus: 'active',
        currentPeriodStart: new Date(1700000000 * 1000),
        currentPeriodEnd: new Date(1702600000 * 1000),
      },
    )
  })

  it('does not create payment when subscription not found', async () => {
    fakeStripeEvent = {
      type: 'invoice.payment_succeeded',
      id: 'evt_5c',
      data: {
        object: {
          id: 'inv_3',
          customer: 'cus_unknown',
          subscription: 'sub_stripe_1',
          amount_paid: 4200,
          currency: 'eur',
          invoice_pdf: null,
          period_start: 1700000000,
          period_end: 1702600000,
        },
      },
    }

    mockSubscriptionFindOne.mockResolvedValue(null)

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockPaymentCreate).not.toHaveBeenCalled()
    expect(mockSubscriptionUpdateOne).not.toHaveBeenCalled()
  })
})

describe('webhook.post — invoice.payment_failed', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    vi.resetModules()
  })

  it('creates Payment record with status failed', async () => {
    fakeStripeEvent = {
      type: 'invoice.payment_failed',
      id: 'evt_6',
      data: {
        object: {
          id: 'inv_fail_1',
          customer: 'cus_123',
          subscription: 'sub_stripe_1',
          amount_due: 4200,
          currency: 'eur',
          invoice_pdf: 'https://stripe.com/pdf',
          period_start: 1700000000,
          period_end: 1702600000,
        },
      },
    }

    mockSubscriptionFindOne.mockResolvedValue({
      _id: 'sub_db_1',
      orgId: 'org456',
      stripeStatus: 'active',
    })
    mockUserFindById.mockResolvedValue({ email: 'user@test.com', _id: 'user123' })
    mockPaymentCreate.mockResolvedValue({})

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockPaymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'org456',
        amount: 4200,
        currency: 'eur',
        status: 'failed',
        pagesCount: null,
      }),
    )
  })

  it('sets subscription stripeStatus to past_due', async () => {
    fakeStripeEvent = {
      type: 'invoice.payment_failed',
      id: 'evt_7',
      data: {
        object: {
          id: 'inv_fail_2',
          customer: 'cus_123',
          subscription: 'sub_stripe_1',
          amount_due: 4200,
          currency: 'eur',
          invoice_pdf: null,
          period_start: 1700000000,
          period_end: 1702600000,
        },
      },
    }

    mockSubscriptionFindOne.mockResolvedValue({
      _id: 'sub_db_1',
      orgId: 'org456',
      stripeStatus: 'active',
    })
    mockUserFindById.mockResolvedValue({ email: 'user@test.com', _id: 'user123' })
    mockPaymentCreate.mockResolvedValue({})

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionUpdateOne).toHaveBeenCalledWith(
      { _id: 'sub_db_1' },
      { stripeStatus: 'past_due' },
    )
  })

  it('returns early when subscription not found for failed invoice', async () => {
    fakeStripeEvent = {
      type: 'invoice.payment_failed',
      id: 'evt_8',
      data: {
        object: {
          id: 'inv_fail_3',
          customer: 'cus_unknown',
          subscription: 'sub_stripe_1',
          amount_due: 4200,
          currency: 'eur',
          invoice_pdf: null,
          period_start: 1700000000,
          period_end: 1702600000,
        },
      },
    }

    mockSubscriptionFindOne.mockResolvedValue(null)

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockPaymentCreate).not.toHaveBeenCalled()
    expect(mockSubscriptionUpdateOne).not.toHaveBeenCalled()
  })
})

describe('webhook.post — customer.subscription.deleted', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    vi.resetModules()
  })

  it('sets stripeStatus to canceled', async () => {
    fakeStripeEvent = {
      type: 'customer.subscription.deleted',
      id: 'evt_9',
      data: {
        object: {
          id: 'sub_stripe_1',
          status: 'canceled',
        },
      },
    }

    mockSubscriptionFindOneAndUpdate.mockResolvedValue({ orgId: 'org456' })

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { stripeSubscriptionId: 'sub_stripe_1' },
      { stripeStatus: 'canceled' },
      { new: true },
    )
  })

  it('handles subscription not found for deletion gracefully', async () => {
    fakeStripeEvent = {
      type: 'customer.subscription.deleted',
      id: 'evt_10',
      data: {
        object: {
          id: 'sub_unknown',
          status: 'canceled',
        },
      },
    }

    mockSubscriptionFindOneAndUpdate.mockResolvedValue(null)

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { stripeSubscriptionId: 'sub_unknown' },
      { stripeStatus: 'canceled' },
      { new: true },
    )
  })
})

describe('webhook.post — invoice.created (usage reporting)', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    vi.resetModules()
  })

  it('reports usage record with correct page count (only crawled pages)', async () => {
    fakeStripeEvent = {
      type: 'invoice.created',
      id: 'evt_11',
      data: {
        object: {
          id: 'inv_created_1',
          subscription: 'sub_stripe_1',
          period_start: 1700000000,
        },
      },
    }

    mockSubscriptionFindOne.mockResolvedValue({
      _id: 'sub_db_1',
      orgId: 'org456',
    })
    mockSiteFind.mockResolvedValue([{ _id: 'site1' }, { _id: 'site2' }])
    mockMonitoredPageCountDocuments.mockResolvedValue(350)
    mockSubscriptionsRetrieve.mockResolvedValue({
      items: { data: [{ id: 'si_item_1' }] },
    })
    mockCreateUsageRecord.mockResolvedValue({})

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockCreateUsageRecord).toHaveBeenCalledWith('si_item_1', {
      quantity: 350,
      action: 'set',
    })
  })

  it('skips usage when no crawled pages in period', async () => {
    fakeStripeEvent = {
      type: 'invoice.created',
      id: 'evt_12',
      data: {
        object: {
          id: 'inv_created_2',
          subscription: 'sub_stripe_1',
          period_start: 1700000000,
        },
      },
    }

    mockSubscriptionFindOne.mockResolvedValue({
      _id: 'sub_db_1',
      orgId: 'org456',
    })
    mockSiteFind.mockResolvedValue([{ _id: 'site1' }])
    mockMonitoredPageCountDocuments.mockResolvedValue(0)

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled()
    expect(mockCreateUsageRecord).not.toHaveBeenCalled()
  })

  it('returns early when subscription not found', async () => {
    fakeStripeEvent = {
      type: 'invoice.created',
      id: 'evt_13',
      data: {
        object: {
          id: 'inv_created_3',
          subscription: 'sub_unknown',
          period_start: 1700000000,
        },
      },
    }

    mockSubscriptionFindOne.mockResolvedValue(null)

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSiteFind).not.toHaveBeenCalled()
    expect(mockCreateUsageRecord).not.toHaveBeenCalled()
  })
})

describe('webhook.post — edge cases', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    vi.resetModules()
  })

  it('checkout.session.completed returns early when customer is missing', async () => {
    fakeStripeEvent = {
      type: 'checkout.session.completed',
      id: 'evt_14',
      data: {
        object: {
          id: 'cs_edge_1',
          customer: null,
          subscription: 'sub_stripe_1',
        },
      },
    }

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled()
    expect(mockSubscriptionFindOneAndUpdate).not.toHaveBeenCalled()
  })

  it('checkout.session.completed returns early when subscription is missing', async () => {
    fakeStripeEvent = {
      type: 'checkout.session.completed',
      id: 'evt_15',
      data: {
        object: {
          id: 'cs_edge_2',
          customer: 'cus_123',
          subscription: null,
        },
      },
    }

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled()
    expect(mockSubscriptionFindOneAndUpdate).not.toHaveBeenCalled()
  })

  it('checkout.session.completed uses period dates from items fallback when root is undefined', async () => {
    fakeStripeEvent = {
      type: 'checkout.session.completed',
      id: 'evt_items_fallback',
      data: {
        object: {
          id: 'cs_items_1',
          customer: 'cus_123',
          subscription: 'sub_stripe_items',
        },
      },
    }

    // Stripe API version where period dates are on items, not on root
    mockSubscriptionsRetrieve.mockResolvedValue({
      status: 'active',
      items: { data: [{ current_period_start: 1710000000, current_period_end: 1712600000 }] },
    })

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { stripeCustomerId: 'cus_123' },
      {
        stripeSubscriptionId: 'sub_stripe_items',
        stripeStatus: 'active',
        currentPeriodStart: new Date(1710000000 * 1000),
        currentPeriodEnd: new Date(1712600000 * 1000),
      },
      { new: true },
    )
  })

  it('checkout.session.completed omits period dates when both root and items are undefined', async () => {
    fakeStripeEvent = {
      type: 'checkout.session.completed',
      id: 'evt_no_period',
      data: {
        object: {
          id: 'cs_no_period',
          customer: 'cus_123',
          subscription: 'sub_stripe_no_period',
        },
      },
    }

    // Neither root nor items have period dates
    mockSubscriptionsRetrieve.mockResolvedValue({
      status: 'trialing',
      items: { data: [{ id: 'si_1' }] },
    })

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    // Should NOT include currentPeriodStart/End in the update (spread of falsy skips them)
    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { stripeCustomerId: 'cus_123' },
      {
        stripeSubscriptionId: 'sub_stripe_no_period',
        stripeStatus: 'trialing',
      },
      { new: true },
    )
  })

  it('checkout.session.completed handles subscription not found in DB gracefully', async () => {
    fakeStripeEvent = {
      type: 'checkout.session.completed',
      id: 'evt_sub_not_found',
      data: {
        object: {
          id: 'cs_orphan',
          customer: 'cus_orphan',
          subscription: 'sub_stripe_orphan',
        },
      },
    }

    mockSubscriptionsRetrieve.mockResolvedValue({
      status: 'active',
      current_period_start: 1700000000,
      current_period_end: 1702600000,
    })
    mockSubscriptionFindOneAndUpdate.mockResolvedValue(null)

    const mod = await import('./webhook.post')
    handler = mod.default

    // Should not throw — just returns early after logging
    await handler(fakeEvent)

    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalled()
  })

  it('subscription.updated returns early when subscription not found in DB', async () => {
    fakeStripeEvent = {
      type: 'customer.subscription.updated',
      id: 'evt_update_not_found',
      data: {
        object: {
          id: 'sub_unknown_update',
          status: 'active',
          current_period_start: 1700000000,
          current_period_end: 1702600000,
        },
      },
    }

    mockSubscriptionFindOneAndUpdate.mockResolvedValue(null)

    const mod = await import('./webhook.post')
    handler = mod.default

    // Should not throw
    await handler(fakeEvent)

    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { stripeSubscriptionId: 'sub_unknown_update' },
      expect.objectContaining({ stripeStatus: 'active' }),
      { new: true },
    )
  })

  it('subscription.updated uses period dates from items fallback', async () => {
    fakeStripeEvent = {
      type: 'customer.subscription.updated',
      id: 'evt_update_items',
      data: {
        object: {
          id: 'sub_stripe_items_update',
          status: 'active',
          // No root-level period dates
          items: { data: [{ current_period_start: 1710000000, current_period_end: 1712600000 }] },
        },
      },
    }

    mockSubscriptionFindOneAndUpdate.mockResolvedValue({ orgId: 'org456' })

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { stripeSubscriptionId: 'sub_stripe_items_update' },
      {
        stripeStatus: 'active',
        currentPeriodStart: new Date(1710000000 * 1000),
        currentPeriodEnd: new Date(1712600000 * 1000),
      },
      { new: true },
    )
  })

  it('invoice.created returns early when no subscription ID on invoice', async () => {
    fakeStripeEvent = {
      type: 'invoice.created',
      id: 'evt_inv_no_sub',
      data: {
        object: {
          id: 'inv_no_sub',
          subscription: null,
          period_start: 1700000000,
        },
      },
    }

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    expect(mockSubscriptionFindOne).not.toHaveBeenCalled()
    expect(mockCreateUsageRecord).not.toHaveBeenCalled()
  })

  it('invoice.created skips usage when org has no sites', async () => {
    fakeStripeEvent = {
      type: 'invoice.created',
      id: 'evt_inv_no_sites',
      data: {
        object: {
          id: 'inv_no_sites',
          subscription: 'sub_stripe_1',
          period_start: 1700000000,
        },
      },
    }

    mockSubscriptionFindOne.mockResolvedValue({
      _id: 'sub_db_1',
      orgId: 'org_empty',
    })
    mockSiteFind.mockResolvedValue([])

    const mod = await import('./webhook.post')
    handler = mod.default
    await handler(fakeEvent)

    // pageCount is 0 when no sites exist (skips countDocuments entirely)
    expect(mockMonitoredPageCountDocuments).not.toHaveBeenCalled()
    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled()
    expect(mockCreateUsageRecord).not.toHaveBeenCalled()
  })
})
