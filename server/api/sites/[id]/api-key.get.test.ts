import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockRequireSiteOrAnyZoneAccess = vi.fn()

vi.mock('../../../database/models', () => ({
  Site: {
    findOne: vi.fn(),
  },
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

describe('api-key.get handler', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./api-key.get')
    handler = mod.default
  })

  it('returns API key for valid site', async () => {
    mockRequireSiteOrAnyZoneAccess.mockResolvedValue({ site: { apiKey: 'abc-123-def' }, role: 'admin' })

    const result = await handler(fakeEvent)

    expect(result).toEqual({ apiKey: 'abc-123-def' })
  })

  it('requires admin role', async () => {
    mockRequireSiteOrAnyZoneAccess.mockResolvedValue({ site: { apiKey: 'key' }, role: 'admin' })

    await handler(fakeEvent)

    expect(mockRequireSiteOrAnyZoneAccess).toHaveBeenCalledWith(fakeEvent, 'site456', 'admin')
  })
})
