import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSiteFindOne = vi.fn()
const mockCreateSite = vi.fn()
const mockRequireOrgRole = vi.fn()

vi.mock('../../database/models', () => ({
  Site: { findOne: (...a: unknown[]) => mockSiteFindOne(...a) },
}))
vi.mock('../../utils/site-create', () => ({
  createSiteWithDefaultZone: (...a: unknown[]) => mockCreateSite(...a),
}))

vi.stubGlobal('defineEventHandler', (handler: (e: unknown) => unknown) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number, message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireAuth', vi.fn(() => 'user1'))
vi.stubGlobal('getOrgIdFromHeader', vi.fn(() => 'org1'))
vi.stubGlobal('requireOrgRole', (...a: unknown[]) => mockRequireOrgRole(...a))
vi.stubGlobal('useRequestLog', vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })))
vi.stubGlobal('isValidUrl', (url: string) => typeof url === 'string' && url.startsWith('http'))
vi.stubGlobal('normalizeUrl', (url: string) => url.replace(/\/$/, ''))
let body: unknown = {}
vi.stubGlobal('readBody', vi.fn(() => Promise.resolve(body)))

const fakeEvent = {} as unknown

describe('POST /api/sites — création réservée à l\'owner', () => {
  let handler: (e: unknown) => Promise<{ _id: string }>

  beforeEach(async () => {
    vi.clearAllMocks()
    body = { name: 'Mon site', url: 'https://exemple.fr' }
    mockRequireOrgRole.mockResolvedValue({ role: 'owner' })
    mockSiteFindOne.mockReturnValue({ lean: () => Promise.resolve(null) })
    mockCreateSite.mockResolvedValue({ _id: 'site1', name: 'Mon site' })
    handler = (await import('./index.post')).default as typeof handler
  })

  it('exige le rôle owner sur l\'orga', async () => {
    await handler(fakeEvent)
    expect(mockRequireOrgRole).toHaveBeenCalledWith(fakeEvent, 'org1', 'owner')
  })

  it('non-owner (requireOrgRole rejette 403) → aucun site créé', async () => {
    mockRequireOrgRole.mockRejectedValue(
      Object.assign(new Error('Permissions insuffisantes'), { statusCode: 403 }),
    )
    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 403 })
    expect(mockCreateSite).not.toHaveBeenCalled()
  })

  it('owner + payload valide → site créé', async () => {
    const result = await handler(fakeEvent)
    expect(mockCreateSite).toHaveBeenCalledWith({ orgId: 'org1', name: 'Mon site', url: 'https://exemple.fr' })
    expect(result._id).toBe('site1')
  })

  it('site déjà configuré → 409, rien créé', async () => {
    mockSiteFindOne.mockReturnValue({ lean: () => Promise.resolve({ _id: 'deja' }) })
    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 409 })
    expect(mockCreateSite).not.toHaveBeenCalled()
  })
})
