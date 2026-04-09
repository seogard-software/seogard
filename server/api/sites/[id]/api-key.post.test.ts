import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockSiteFindOneAndUpdate = vi.fn()
const mockRequireSiteOrAnyZoneAccess = vi.fn()

vi.mock('../../../database/models', () => ({
  Site: {
    findOneAndUpdate: (...args: unknown[]) => mockSiteFindOneAndUpdate(...args),
  },
}))

vi.mock('node:crypto', () => ({
  randomUUID: () => 'new-uuid-1234',
}))

// Stub Nuxt auto-imports
vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireValidId', vi.fn(() => 'site456'))
vi.stubGlobal('requireSiteOrAnyZoneAccess', mockRequireSiteOrAnyZoneAccess)

describe('api-key.post handler', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRequireSiteOrAnyZoneAccess.mockResolvedValue({ site: { _id: 'site456' }, role: 'admin' })
    const mod = await import('./api-key.post')
    handler = mod.default
  })

  it('regenerates API key and returns it', async () => {
    mockSiteFindOneAndUpdate.mockResolvedValue({ apiKey: 'new-uuid-1234' })

    const result = await handler(fakeEvent)

    expect(result).toEqual({ apiKey: 'new-uuid-1234' })
    expect(mockSiteFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'site456' },
      { apiKey: 'new-uuid-1234' },
      { new: true, projection: { apiKey: 1 } },
    )
  })

  it('returns 404 when site not found', async () => {
    mockSiteFindOneAndUpdate.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('Site non trouvé')
  })
})
