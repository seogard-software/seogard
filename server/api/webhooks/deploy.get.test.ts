import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockSiteFindOne = vi.fn()
const mockCrawlFindOne = vi.fn()
const mockAlertCountDocuments = vi.fn()

vi.mock('../../database/models', () => ({
  Site: {
    findOne: (...args: unknown[]) => ({ select: () => ({ lean: () => mockSiteFindOne(...args) }) }),
  },
  Crawl: {
    findOne: (...args: unknown[]) => ({ select: () => ({ lean: () => mockCrawlFindOne(...args) }) }),
  },
  Alert: {
    countDocuments: (...args: unknown[]) => mockAlertCountDocuments(...args),
  },
}))

// Stub Nuxt auto-imports
vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('getHeader', vi.fn())
vi.stubGlobal('getQuery', vi.fn())

function setupCompleted(site: Record<string, unknown>, counts: [number, number, number]) {
  ;(getHeader as any).mockReturnValue('valid-key')
  mockSiteFindOne.mockResolvedValue(site)
  ;(getQuery as any).mockReturnValue({ crawlId: 'crawl1' })
  mockCrawlFindOne.mockResolvedValue({ status: 'completed', pagesScanned: 100, pagesTotal: 100 })
  mockAlertCountDocuments
    .mockResolvedValueOnce(counts[0]) // critical
    .mockResolvedValueOnce(counts[1]) // warning
    .mockResolvedValueOnce(counts[2]) // info
}

describe('deploy.get webhook (status check)', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./deploy.get')
    handler = mod.default
  })

  it('returns 401 without x-api-key', async () => {
    ;(getHeader as any).mockReturnValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('API key requise')
  })

  it('returns 401 with invalid API key', async () => {
    ;(getHeader as any).mockReturnValue('bad-key')
    mockSiteFindOne.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('API key invalide')
  })

  it('returns 400 without crawlId query param', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1' })
    ;(getQuery as any).mockReturnValue({})

    await expect(handler(fakeEvent)).rejects.toThrow('crawlId requis')
  })

  it('returns 404 when crawl not found', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1' })
    ;(getQuery as any).mockReturnValue({ crawlId: 'crawl999' })
    mockCrawlFindOne.mockResolvedValue(null)

    await expect(handler(fakeEvent)).rejects.toThrow('Crawl non trouvé')
  })

  it('returns pass=null when crawl is pending', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1' })
    ;(getQuery as any).mockReturnValue({ crawlId: 'crawl1' })
    mockCrawlFindOne.mockResolvedValue({ status: 'pending', pagesScanned: 0, pagesTotal: 100 })

    const result = await handler(fakeEvent)

    expect(result.status).toBe('pending')
    expect(result.pass).toBeNull()
  })

  it('returns pass=null when crawl is running', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1' })
    ;(getQuery as any).mockReturnValue({ crawlId: 'crawl1' })
    mockCrawlFindOne.mockResolvedValue({ status: 'running', pagesScanned: 50, pagesTotal: 100 })

    const result = await handler(fakeEvent)

    expect(result.status).toBe('running')
    expect(result.pass).toBeNull()
    expect(result.progress).toEqual({ pagesScanned: 50, pagesTotal: 100 })
  })

  it('returns pass=null when crawl failed', async () => {
    ;(getHeader as any).mockReturnValue('valid-key')
    mockSiteFindOne.mockResolvedValue({ _id: 'site1' })
    ;(getQuery as any).mockReturnValue({ crawlId: 'crawl1' })
    mockCrawlFindOne.mockResolvedValue({ status: 'failed', error: 'Timeout' })

    const result = await handler(fakeEvent)

    expect(result.status).toBe('failed')
    expect(result.pass).toBeNull()
    expect(result.message).toBe('Timeout')
  })

  // --- Standard (default) ---

  it('standard: pass=true when 0 critical', async () => {
    setupCompleted({ _id: 'site1', ciStrictness: 'standard' }, [0, 3, 1])

    const result = await handler(fakeEvent)

    expect(result.pass).toBe(true)
    expect(result.strictness).toBe('standard')
    expect(result.alerts).toEqual({ critical: 0, warning: 3, info: 1, total: 4 })
  })

  it('standard: pass=false when >=1 critical', async () => {
    setupCompleted({ _id: 'site1', ciStrictness: 'standard' }, [2, 5, 0])

    const result = await handler(fakeEvent)

    expect(result.pass).toBe(false)
    expect(result.strictness).toBe('standard')
  })

  it('defaults to standard when ciStrictness not set', async () => {
    setupCompleted({ _id: 'site1' }, [1, 0, 0])

    const result = await handler(fakeEvent)

    expect(result.pass).toBe(false)
    expect(result.strictness).toBe('standard')
  })

  // --- Strict ---

  it('strict: pass=false when warnings only (0 critical)', async () => {
    setupCompleted({ _id: 'site1', ciStrictness: 'strict' }, [0, 2, 0])

    const result = await handler(fakeEvent)

    expect(result.pass).toBe(false)
    expect(result.strictness).toBe('strict')
  })

  it('strict: pass=true when 0 critical and 0 warning', async () => {
    setupCompleted({ _id: 'site1', ciStrictness: 'strict' }, [0, 0, 3])

    const result = await handler(fakeEvent)

    expect(result.pass).toBe(true)
    expect(result.strictness).toBe('strict')
  })

  // --- Relaxed ---

  it('relaxed: pass=true when 4 critical (under threshold)', async () => {
    setupCompleted({ _id: 'site1', ciStrictness: 'relaxed' }, [4, 10, 5])

    const result = await handler(fakeEvent)

    expect(result.pass).toBe(true)
    expect(result.strictness).toBe('relaxed')
  })

  it('relaxed: pass=false when 5+ critical', async () => {
    setupCompleted({ _id: 'site1', ciStrictness: 'relaxed' }, [5, 0, 0])

    const result = await handler(fakeEvent)

    expect(result.pass).toBe(false)
    expect(result.strictness).toBe('relaxed')
  })
})
