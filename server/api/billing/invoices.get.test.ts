import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockPaymentFind = vi.fn()
const mockOrgMemberFindOne = vi.fn()

const mockLean = vi.fn()
const mockSelect = vi.fn(() => ({ lean: mockLean }))
const mockLimit = vi.fn(() => ({ select: mockSelect }))
const mockSort = vi.fn(() => ({ limit: mockLimit }))

vi.mock('../../database/models', () => ({
  Payment: {
    find: (...args: unknown[]) => {
      mockPaymentFind(...args)
      return { sort: mockSort }
    },
  },
  OrgMember: {
    findOne: (...args: unknown[]) => ({ lean: () => mockOrgMemberFindOne(...args) }),
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
vi.stubGlobal('getHeader', vi.fn(() => 'org456'))

describe('/api/billing/invoices', () => {
  let handler: Function
  const fakeEvent = {} as any

  const fakeInvoices = [
    {
      amount: 2500,
      currency: 'eur',
      status: 'paid',
      pagesCount: 250,
      invoicePdfUrl: 'https://stripe.com/invoice/pdf/1',
      periodStart: new Date('2026-02-01'),
      periodEnd: new Date('2026-03-01'),
      createdAt: new Date('2026-03-01'),
    },
    {
      amount: 1800,
      currency: 'eur',
      status: 'paid',
      pagesCount: 180,
      invoicePdfUrl: 'https://stripe.com/invoice/pdf/2',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-02-01'),
      createdAt: new Date('2026-02-01'),
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    mockOrgMemberFindOne.mockResolvedValue({ orgId: 'org456', userId: 'user123', role: 'owner' })
    mockLean.mockResolvedValue(fakeInvoices)
    ;(globalThis as any).getHeader = vi.fn(() => 'org456')
    ;(globalThis as any).requireAuth = vi.fn(() => 'user123')
    vi.resetModules()
    const mod = await import('./invoices.get')
    handler = mod.default
  })

  it('returns invoices for valid org member', async () => {
    const result = await handler(fakeEvent)

    expect(result).toEqual({ invoices: fakeInvoices })
    expect(mockPaymentFind).toHaveBeenCalledWith({ orgId: 'org456' })
    expect(mockOrgMemberFindOne).toHaveBeenCalledWith({ orgId: 'org456', userId: 'user123' })
  })

  it('throws 400 when x-org-id header is missing', async () => {
    ;(globalThis as any).getHeader = vi.fn(() => null)
    vi.resetModules()
    const mod = await import('./invoices.get')
    handler = mod.default

    await expect(handler(fakeEvent)).rejects.toThrow('Organization requise')
  })

  it('throws 403 when user is not a member of the org', async () => {
    mockOrgMemberFindOne.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('Accès refusé')
  })

  it('returns empty array when no invoices exist', async () => {
    mockLean.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result).toEqual({ invoices: [] })
  })

  it('limits to 50 invoices', async () => {
    await handler(fakeEvent)

    expect(mockLimit).toHaveBeenCalledWith(50)
  })

  it('sorts by createdAt descending', async () => {
    await handler(fakeEvent)

    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 })
  })

  it('selects only the required fields', async () => {
    await handler(fakeEvent)

    expect(mockSelect).toHaveBeenCalledWith(
      'amount currency status pagesCount invoicePdfUrl periodStart periodEnd createdAt',
    )
  })
})
