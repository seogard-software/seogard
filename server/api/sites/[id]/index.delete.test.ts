import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockRequireSiteAccess = vi.fn()
const mockSiteFindOneAndDelete = vi.fn()
const mockMonitoredPageFind = vi.fn()
const mockAlertDeleteMany = vi.fn()
const mockCrawlDeleteMany = vi.fn()
const mockMonitoredPageDeleteMany = vi.fn()
const mockPageSnapshotDeleteMany = vi.fn()

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

    await handler(fakeEvent)

    expect(mockRequireSiteAccess).toHaveBeenCalledWith(fakeEvent, 'site456', 'admin')
  })

  it('returns 404 when site not found', async () => {
    mockSiteFindOneAndDelete.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('Site non trouvé')
  })

  it('cascade deletes all related documents', async () => {
    mockSiteFindOneAndDelete.mockResolvedValue({ _id: 'site456', name: 'Test' })
    mockMonitoredPageFind.mockResolvedValue([{ _id: 'p1' }, { _id: 'p2' }])
    mockAlertDeleteMany.mockResolvedValue({})
    mockCrawlDeleteMany.mockResolvedValue({})
    mockMonitoredPageDeleteMany.mockResolvedValue({})
    mockPageSnapshotDeleteMany.mockResolvedValue({})

    const result = await handler(fakeEvent)

    expect(result).toEqual({ success: true })
    expect(mockAlertDeleteMany).toHaveBeenCalledWith({ siteId: 'site456' })
    expect(mockCrawlDeleteMany).toHaveBeenCalledWith({ siteId: 'site456' })
    expect(mockMonitoredPageDeleteMany).toHaveBeenCalledWith({ siteId: 'site456' })
    expect(mockPageSnapshotDeleteMany).toHaveBeenCalledWith({ pageId: { $in: ['p1', 'p2'] } })
  })
})
