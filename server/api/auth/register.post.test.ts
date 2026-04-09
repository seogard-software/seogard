import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockUserFindOne = vi.fn()
const mockUserCreate = vi.fn()
const mockUserDeleteOne = vi.fn()
const mockUserCountDocuments = vi.fn(() => 0)
const mockOrgCreate = vi.fn()
const mockOrgMemberCreate = vi.fn()
const mockSubCreate = vi.fn()
const mockRefreshTokenCreate = vi.fn()

vi.mock('../../database/models', () => ({
  User: {
    findOne: (...args: unknown[]) => ({ lean: () => mockUserFindOne(...args) }),
    create: (...args: unknown[]) => mockUserCreate(...args),
    deleteOne: (...args: unknown[]) => mockUserDeleteOne(...args),
    countDocuments: () => mockUserCountDocuments(),
  },
  Organization: { create: (...args: unknown[]) => mockOrgCreate(...args) },
  OrgMember: {
    create: (...args: unknown[]) => mockOrgMemberCreate(...args),
    deleteMany: vi.fn(),
  },
  Subscription: { create: (...args: unknown[]) => mockSubCreate(...args) },
  RefreshToken: { create: (...args: unknown[]) => mockRefreshTokenCreate(...args) },
}))

const mockIsSelfHosted = vi.fn(() => false)
vi.mock('../../utils/deployment', () => ({
  isSelfHosted: () => mockIsSelfHosted(),
}))

vi.mock('../../utils/auth', () => ({
  hashPassword: vi.fn(async (p: string) => `hashed_${p}`),
  generateAccessToken: vi.fn(() => 'access-token'),
  generateRefreshTokenValue: vi.fn(() => 'refresh-token'),
  setAuthCookies: vi.fn(),
  getRefreshTokenExpiresAt: vi.fn(() => new Date()),
}))

vi.mock('../../utils/email', () => ({
  sendWelcomeEmail: vi.fn(),
}))

vi.mock('../../utils/stripe', () => ({
  getStripe: vi.fn(() => null),
}))

vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('useRequestLog', vi.fn(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})))

describe('register.post — cloud mode', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockIsSelfHosted.mockReturnValue(false)
    ;(readBody as any).mockResolvedValue({
      email: 'test@example.com',
      password: 'password123',
      acceptedTerms: true,
      orgName: 'My Org',
    })
    mockUserFindOne.mockResolvedValue(null)
    mockUserCreate.mockResolvedValue({ _id: 'user1', email: 'test@example.com', name: null, avatarUrl: null, authProvider: 'local' })
    mockOrgCreate.mockResolvedValue({ _id: 'org1', name: 'My Org' })
    mockOrgMemberCreate.mockResolvedValue({})
    mockSubCreate.mockResolvedValue({ _id: 'sub1' })
    mockRefreshTokenCreate.mockResolvedValue({})
    const mod = await import('./register.post')
    handler = mod.default
  })

  it('creates subscription with trialing status', async () => {
    await handler(fakeEvent)

    expect(mockSubCreate).toHaveBeenCalledWith(
      expect.objectContaining({ stripeStatus: 'trialing' }),
    )
  })

  it('sets trialEndsAt on user', async () => {
    await handler(fakeEvent)

    const createCall = mockUserCreate.mock.calls[0][0]
    expect(createCall.trialEndsAt).toBeInstanceOf(Date)
    expect(createCall.trialEndsAt.getTime()).toBeGreaterThan(Date.now())
  })
})

describe('register.post — self-hosted mode', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockIsSelfHosted.mockReturnValue(true)
    ;(readBody as any).mockResolvedValue({
      email: 'admin@myserver.com',
      password: 'password123',
      acceptedTerms: true,
      orgName: 'Self-Hosted Org',
    })
    mockUserFindOne.mockResolvedValue(null)
    mockUserCreate.mockResolvedValue({ _id: 'user1', email: 'admin@myserver.com', name: null, avatarUrl: null, authProvider: 'local' })
    mockOrgCreate.mockResolvedValue({ _id: 'org1', name: 'Self-Hosted Org' })
    mockOrgMemberCreate.mockResolvedValue({})
    mockSubCreate.mockResolvedValue({ _id: 'sub1' })
    mockRefreshTokenCreate.mockResolvedValue({})
    const mod = await import('./register.post')
    handler = mod.default
  })

  it('does not create any subscription', async () => {
    await handler(fakeEvent)

    expect(mockSubCreate).not.toHaveBeenCalled()
  })

  it('does not set trialEndsAt on user', async () => {
    await handler(fakeEvent)

    const createCall = mockUserCreate.mock.calls[0][0]
    expect(createCall.trialEndsAt).toBeNull()
  })

  it('blocks registration if users already exist', async () => {
    mockUserCountDocuments.mockReturnValue(1)
    const mod = await import('./register.post')
    const blockedHandler = mod.default

    await expect(blockedHandler(fakeEvent)).rejects.toThrow('Inscription désactivée')
  })

  it('allows registration when 0 users (first admin)', async () => {
    mockUserCountDocuments.mockReturnValue(0)

    const result = await handler(fakeEvent)

    expect(result.user.email).toBe('admin@myserver.com')
  })
})
