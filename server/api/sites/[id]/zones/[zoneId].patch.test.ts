import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockRequireZoneAccess = vi.fn()
const mockZoneFindOne = vi.fn()
const mockZoneFindOneUnique = vi.fn()
const mockZoneFindByIdAndUpdate = vi.fn()

vi.mock('~~/server/database/models', () => ({
  Zone: {
    findOne: (...args: unknown[]) => {
      // Differentiate between zone lookup and uniqueness check
      const filter = args[0] as Record<string, unknown>
      if (filter?.$ne !== undefined || filter?._id?.$ne !== undefined) {
        return { lean: () => mockZoneFindOneUnique(...args) }
      }
      // For uniqueness check with _id.$ne
      if (typeof filter === 'object' && filter !== null && 'name' in filter && '_id' in filter) {
        return { lean: () => mockZoneFindOneUnique(...args) }
      }
      return mockZoneFindOne(...args)
    },
    findByIdAndUpdate: (...args: unknown[]) => ({ lean: () => mockZoneFindByIdAndUpdate(...args) }),
  },
}))

vi.mock('~~/shared/utils/zone', async () => {
  const actual = await vi.importActual<typeof import('~~/shared/utils/zone')>('~~/shared/utils/zone')
  return actual
})

vi.mock('~~/server/utils/tree-cache', () => ({
  invalidateTreeCache: vi.fn(),
}))

vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireValidId', vi.fn(() => 'site456'))
vi.stubGlobal('requireZoneAccess', mockRequireZoneAccess)
vi.stubGlobal('getRouterParam', vi.fn(() => 'zone789'))
vi.stubGlobal('readBody', vi.fn())

describe('zone.patch — security', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRequireZoneAccess.mockResolvedValue({ site: { _id: 'site456' }, role: 'admin' })
    const mod = await import('./[zoneId].patch')
    handler = mod.default
  })

  it('requires admin role', async () => {
    mockZoneFindOne.mockResolvedValue({ _id: 'zone789', isDefault: false })
    mockZoneFindOneUnique.mockResolvedValue(null)
    mockZoneFindByIdAndUpdate.mockResolvedValue({ _id: 'zone789' })
    vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'Updated' })

    await handler(fakeEvent)

    expect(mockRequireZoneAccess).toHaveBeenCalledWith(fakeEvent, 'site456', 'zone789', 'admin')
  })

  it('blocks modification of default zone', async () => {
    mockZoneFindOne.mockResolvedValue({ _id: 'zone789', isDefault: true })
    vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'Hack' })

    await expect(handler(fakeEvent)).rejects.toThrow('zone par défaut ne peut pas être modifiée')
  })

  it('returns 404 when zone not found', async () => {
    mockZoneFindOne.mockResolvedValue(null)
    vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'X' })

    await expect(handler(fakeEvent)).rejects.toThrow('Zone introuvable')
  })

  it('rejects empty name', async () => {
    mockZoneFindOne.mockResolvedValue({ _id: 'zone789', isDefault: false })
    vi.mocked(globalThis.readBody).mockResolvedValue({ name: '  ' })

    await expect(handler(fakeEvent)).rejects.toThrow('nom ne peut pas être vide')
  })

  it('rejects invalid pattern', async () => {
    mockZoneFindOne.mockResolvedValue({ _id: 'zone789', isDefault: false })
    vi.mocked(globalThis.readBody).mockResolvedValue({ patterns: ['no-slash'] })

    await expect(handler(fakeEvent)).rejects.toThrow('Pattern invalide')
  })

  it('rejects empty patterns array', async () => {
    mockZoneFindOne.mockResolvedValue({ _id: 'zone789', isDefault: false })
    vi.mocked(globalThis.readBody).mockResolvedValue({ patterns: [] })

    await expect(handler(fakeEvent)).rejects.toThrow('Au moins un path est requis')
  })
})
