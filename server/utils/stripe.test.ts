import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('stripe', () => {
  const MockStripe = vi.fn(() => ({
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
  }))
  return { default: MockStripe }
})

vi.mock('./logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('stripe utils', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getStripe', () => {
    it('returns null when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY
      const { getStripe } = await import('./stripe')
      expect(getStripe()).toBeNull()
    })

    it('returns a Stripe instance when key is set', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      const { getStripe } = await import('./stripe')
      const stripe = getStripe()
      expect(stripe).not.toBeNull()
    })

    it('returns the same instance on subsequent calls (singleton)', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      const { getStripe } = await import('./stripe')
      const first = getStripe()
      const second = getStripe()
      expect(first).toBe(second)
    })
  })
})
