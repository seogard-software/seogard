import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockRequireZoneAccess = vi.fn()
const mockZoneFindOne = vi.fn()
const mockZoneCreate = vi.fn()
const mockSiteFindById = vi.fn()
const mockOrgMemberFindOne = vi.fn()

vi.mock('~~/server/database/models', () => ({
  Zone: {
    findOne: (...args: unknown[]) => ({ lean: () => mockZoneFindOne(...args) }),
    create: (...args: unknown[]) => mockZoneCreate(...args),
  },
  Site: {
    findById: (...args: unknown[]) => ({ select: () => ({ lean: () => mockSiteFindById(...args) }) }),
  },
  OrgMember: {
    findOne: (...args: unknown[]) => mockOrgMemberFindOne(...args),
  },
}))

vi.mock('~~/shared/utils/zone', async () => {
  const actual = await vi.importActual<typeof import('~~/shared/utils/zone')>('~~/shared/utils/zone')
  return actual
})

vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireAuth', vi.fn(() => 'user123'))
vi.stubGlobal('requireValidId', vi.fn(() => 'site456'))
vi.stubGlobal('requireZoneAccess', mockRequireZoneAccess)
vi.stubGlobal('readBody', vi.fn())

describe('zones.post — security & validation', () => {
  let handler: Function
  const fakeEvent = {} as any

  const defaultZone = { _id: 'default-zone-id', isDefault: true, siteId: 'site456' }

  beforeEach(async () => {
    vi.clearAllMocks()
    // First findOne call = find default zone, subsequent calls = uniqueness check
    mockZoneFindOne.mockResolvedValueOnce(defaultZone)
    mockRequireZoneAccess.mockResolvedValue({ site: { _id: 'site456' }, role: 'admin' })
    mockSiteFindById.mockResolvedValue({ _id: 'site456', orgId: 'org123' })
    mockOrgMemberFindOne.mockResolvedValue({ role: 'owner', zoneRoles: [] })
    const mod = await import('./index.post')
    handler = mod.default
  })

  it('requires admin role on default zone', async () => {
    vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'Blog', patterns: ['/blog/**'] })
    mockZoneFindOne.mockResolvedValueOnce(null) // uniqueness check
    mockZoneCreate.mockResolvedValue({ _id: 'new-zone', name: 'Blog', patterns: ['/blog/**'] })

    await handler(fakeEvent)

    expect(mockRequireZoneAccess).toHaveBeenCalledWith(fakeEvent, 'site456', 'default-zone-id', 'admin')
  })

  it('rejects missing name', async () => {
    vi.mocked(globalThis.readBody).mockResolvedValue({ patterns: ['/blog/**'] })

    await expect(handler(fakeEvent)).rejects.toThrow('nom est requis')
  })

  it('rejects empty patterns', async () => {
    vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'Blog', patterns: [] })

    await expect(handler(fakeEvent)).rejects.toThrow('Au moins un path est requis')
  })

  it('rejects invalid pattern (no leading slash)', async () => {
    vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'Blog', patterns: ['blog/**'] })

    await expect(handler(fakeEvent)).rejects.toThrow('Pattern invalide')
  })

  it('rejects duplicate zone name within site', async () => {
    vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'Existing', patterns: ['/test/**'] })
    mockZoneFindOne.mockResolvedValue({ _id: 'existing-zone', name: 'Existing' })

    await expect(handler(fakeEvent)).rejects.toThrow('zone avec ce nom existe déjà')
  })

  it('passes patterns through normalizePattern', async () => {
    vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'Products', patterns: ['/products/'] })
    mockZoneFindOne.mockResolvedValue(null)
    mockZoneCreate.mockResolvedValue({ _id: 'z1', patterns: ['/products'] })

    await handler(fakeEvent)

    // normalizePattern strips trailing slash
    expect(mockZoneCreate).toHaveBeenCalledWith(
      expect.objectContaining({ patterns: ['/products'] }),
    )
  })

  it('always creates with isDefault: false', async () => {
    vi.mocked(globalThis.readBody).mockResolvedValue({ name: 'Hack', patterns: ['/x/**'], isDefault: true })
    mockZoneFindOne.mockResolvedValue(null)
    mockZoneCreate.mockResolvedValue({ _id: 'z1' })

    await handler(fakeEvent)

    expect(mockZoneCreate).toHaveBeenCalledWith(
      expect.objectContaining({ isDefault: false }),
    )
  })
})
