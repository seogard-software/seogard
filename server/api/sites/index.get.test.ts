import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSiteFind = vi.fn()
const mockMonitoredAggregate = vi.fn()
const mockCrawlAggregate = vi.fn()
const mockOrgMemberFindOne = vi.fn()
const mockZoneFind = vi.fn()
const mockRequireOrgRole = vi.fn()

vi.mock('../../database/models', () => ({
  Site: { find: (...a: unknown[]) => mockSiteFind(...a) },
  MonitoredPage: { aggregate: (...a: unknown[]) => mockMonitoredAggregate(...a) },
  Crawl: { aggregate: (...a: unknown[]) => mockCrawlAggregate(...a) },
  OrgMember: { findOne: (...a: unknown[]) => mockOrgMemberFindOne(...a) },
  Zone: { find: (...a: unknown[]) => mockZoneFind(...a) },
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

const fakeEvent = {} as unknown
const siteDoc = (id: string) => ({ _id: id, name: id, url: `https://${id}.fr`, lastCrawlAt: null })

describe('GET /api/sites — visibilité selon le rôle', () => {
  let handler: (e: unknown) => Promise<Array<{ _id: string }>>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockMonitoredAggregate.mockResolvedValue([])
    mockCrawlAggregate.mockResolvedValue([])
    mockSiteFind.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) })
    handler = (await import('./index.get')).default as typeof handler
  })

  it('owner → tous les sites de l\'orga, sans toucher aux zoneRoles', async () => {
    mockRequireOrgRole.mockResolvedValue({ role: 'owner' })
    mockSiteFind.mockReturnValue({
      sort: () => ({ lean: () => Promise.resolve([siteDoc('a'), siteDoc('b'), siteDoc('c')]) }),
    })

    const result = await handler(fakeEvent)

    expect(mockSiteFind).toHaveBeenCalledWith({ orgId: 'org1' })
    expect(mockOrgMemberFindOne).not.toHaveBeenCalled()
    expect(mockZoneFind).not.toHaveBeenCalled()
    expect(result).toHaveLength(3)
  })

  it('member avec un zoneRole sur 1 site → ne voit que ce site (pas les 3)', async () => {
    mockRequireOrgRole.mockResolvedValue({ role: 'member' })
    mockOrgMemberFindOne.mockReturnValue({
      lean: () => Promise.resolve({ role: 'member', zoneRoles: [{ zoneId: 'z1', role: 'viewer' }] }),
    })
    mockZoneFind.mockReturnValue({ distinct: () => Promise.resolve(['a']) })
    mockSiteFind.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([siteDoc('a')]) }) })

    const result = await handler(fakeEvent)

    expect(mockZoneFind).toHaveBeenCalledWith({ _id: { $in: ['z1'] } })
    expect(mockSiteFind).toHaveBeenCalledWith({ orgId: 'org1', _id: { $in: ['a'] } })
    expect(result).toHaveLength(1)
    expect(result[0]!._id).toBe('a')
  })

  it('member sans aucun zoneRole → liste vide', async () => {
    mockRequireOrgRole.mockResolvedValue({ role: 'member' })
    mockOrgMemberFindOne.mockReturnValue({
      lean: () => Promise.resolve({ role: 'member', zoneRoles: [] }),
    })
    mockZoneFind.mockReturnValue({ distinct: () => Promise.resolve([]) })
    mockSiteFind.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) })

    const result = await handler(fakeEvent)

    expect(mockSiteFind).toHaveBeenCalledWith({ orgId: 'org1', _id: { $in: [] } })
    expect(result).toHaveLength(0)
  })
})
