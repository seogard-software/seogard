import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockRequireZoneAccess = vi.fn()
const mockZoneFindOne = vi.fn()
const mockZoneDeleteOne = vi.fn()
const mockOrgMemberUpdateMany = vi.fn()

vi.mock('~~/server/database/models', () => ({
  Zone: {
    findOne: (...args: unknown[]) => ({ lean: () => mockZoneFindOne(...args) }),
    deleteOne: (...args: unknown[]) => mockZoneDeleteOne(...args),
  },
  OrgMember: {
    updateMany: (...args: unknown[]) => mockOrgMemberUpdateMany(...args),
  },
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

describe('zone.delete — security', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRequireZoneAccess.mockResolvedValue({ site: { _id: 'site456', orgId: 'org123' }, role: 'admin' })
    const mod = await import('./[zoneId].delete')
    handler = mod.default
  })

  it('requires admin role', async () => {
    mockZoneFindOne.mockResolvedValue({ _id: 'zone789', isDefault: false })
    mockZoneDeleteOne.mockResolvedValue({})
    mockOrgMemberUpdateMany.mockResolvedValue({})

    await handler(fakeEvent)

    expect(mockRequireZoneAccess).toHaveBeenCalledWith(fakeEvent, 'site456', 'zone789', 'admin')
  })

  it('blocks deletion of default zone', async () => {
    mockZoneFindOne.mockResolvedValue({ _id: 'zone789', isDefault: true })

    await expect(handler(fakeEvent)).rejects.toThrow('zone par défaut ne peut pas être supprimée')
  })

  it('returns 404 when zone not found', async () => {
    mockZoneFindOne.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('Zone introuvable')
  })

  it('deletes custom zone and cascades zoneRoles', async () => {
    mockZoneFindOne.mockResolvedValue({ _id: 'zone789', isDefault: false })
    mockZoneDeleteOne.mockResolvedValue({})
    mockOrgMemberUpdateMany.mockResolvedValue({})

    const result = await handler(fakeEvent)

    expect(result).toEqual({ success: true })
    expect(mockZoneDeleteOne).toHaveBeenCalledWith({ _id: 'zone789' })
    expect(mockOrgMemberUpdateMany).toHaveBeenCalledWith(
      { orgId: 'org123' },
      { $pull: { zoneRoles: { zoneId: 'zone789' } } },
    )
  })
})
