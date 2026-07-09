import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockRequireSiteAccess = vi.fn()
const mockSiteFindOneAndDelete = vi.fn()
const mockMonitoredPageFind = vi.fn()
const mockAlertDeleteMany = vi.fn()
const mockCrawlDeleteMany = vi.fn()
const mockMonitoredPageDeleteMany = vi.fn()
const mockPageSnapshotDeleteMany = vi.fn()
const mockZoneDeleteMany = vi.fn()
const mockCrawlScheduleDeleteMany = vi.fn()
const mockMutedRuleDeleteMany = vi.fn()
const mockCrawlReportDeleteMany = vi.fn()

vi.mock('../../../database/models', () => ({
  Site: {
    findOneAndDelete: (...args: unknown[]) => ({ lean: () => mockSiteFindOneAndDelete(...args) }),
  },
  MonitoredPage: {
    find: (...args: unknown[]) => ({ select: () => ({ lean: () => mockMonitoredPageFind(...args) }) }),
    deleteMany: (...args: unknown[]) => mockMonitoredPageDeleteMany(...args),
  },
  Alert: {
    deleteMany: (...args: unknown[]) => mockAlertDeleteMany(...args),
  },
  Crawl: {
    deleteMany: (...args: unknown[]) => mockCrawlDeleteMany(...args),
  },
  PageSnapshot: {
    deleteMany: (...args: unknown[]) => mockPageSnapshotDeleteMany(...args),
  },
  Zone: {
    deleteMany: (...args: unknown[]) => mockZoneDeleteMany(...args),
  },
  CrawlSchedule: {
    deleteMany: (...args: unknown[]) => mockCrawlScheduleDeleteMany(...args),
  },
  MutedRule: {
    deleteMany: (...args: unknown[]) => mockMutedRuleDeleteMany(...args),
  },
  CrawlReport: {
    // La cascade lit les clés R2 (mdKey/pdfKey) avant de supprimer les lignes.
    find: () => ({ select: () => ({ lean: () => Promise.resolve([]) }) }),
    deleteMany: (...args: unknown[]) => mockCrawlReportDeleteMany(...args),
  },
}))

vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireValidId', vi.fn(() => 'site456'))
vi.stubGlobal('requireSiteAccess', mockRequireSiteAccess)
vi.stubGlobal('useRequestLog', vi.fn(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})))

describe('site.delete — security', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRequireSiteAccess.mockResolvedValue({ site: { _id: 'site456' }, role: 'admin' })
    const mod = await import('./index.delete')
    handler = mod.default
  })

  it('requires admin role', async () => {
    mockSiteFindOneAndDelete.mockResolvedValue({ _id: 'site456', name: 'Test' })
    mockMonitoredPageFind.mockResolvedValue([])
    mockAlertDeleteMany.mockResolvedValue({})
    mockCrawlDeleteMany.mockResolvedValue({})
    mockMonitoredPageDeleteMany.mockResolvedValue({})
    mockZoneDeleteMany.mockResolvedValue({})
    mockCrawlScheduleDeleteMany.mockResolvedValue({})
    mockMutedRuleDeleteMany.mockResolvedValue({})

    await handler(fakeEvent)

    expect(mockRequireSiteAccess).toHaveBeenCalledWith(fakeEvent, 'site456', 'admin')
  })

  it('returns 404 when site not found', async () => {
    mockSiteFindOneAndDelete.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('Site not found')
  })

  it('cascade deletes all related documents', async () => {
    mockSiteFindOneAndDelete.mockResolvedValue({ _id: 'site456', name: 'Test' })
    mockMonitoredPageFind.mockResolvedValue([{ _id: 'p1' }, { _id: 'p2' }])
    mockAlertDeleteMany.mockResolvedValue({})
    mockCrawlDeleteMany.mockResolvedValue({})
    mockMonitoredPageDeleteMany.mockResolvedValue({})
    mockPageSnapshotDeleteMany.mockResolvedValue({})
    mockZoneDeleteMany.mockResolvedValue({})
    mockCrawlScheduleDeleteMany.mockResolvedValue({})
    mockMutedRuleDeleteMany.mockResolvedValue({})

    const result = await handler(fakeEvent)

    expect(result).toEqual({ success: true })
    // La cascade passe par deleteSitesCascade (server/database/cascade.ts) → filtres $in.
    const bySite = { siteId: { $in: ['site456'] } }
    expect(mockAlertDeleteMany).toHaveBeenCalledWith(bySite)
    expect(mockCrawlDeleteMany).toHaveBeenCalledWith(bySite)
    expect(mockMonitoredPageDeleteMany).toHaveBeenCalledWith(bySite)
    expect(mockZoneDeleteMany).toHaveBeenCalledWith(bySite)
    expect(mockCrawlScheduleDeleteMany).toHaveBeenCalledWith(bySite)
    expect(mockMutedRuleDeleteMany).toHaveBeenCalledWith(bySite)
    expect(mockCrawlReportDeleteMany).toHaveBeenCalledWith(bySite)
    expect(mockPageSnapshotDeleteMany).toHaveBeenCalledWith({ pageId: { $in: ['p1', 'p2'] } })
  })
})
