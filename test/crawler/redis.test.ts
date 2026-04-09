import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock ioredis
const mockRedis = {
  sadd: vi.fn(),
  srem: vi.fn(),
  smembers: vi.fn(),
  scard: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  eval: vi.fn(),
  get: vi.fn(),
  llen: vi.fn(),
  rpop: vi.fn(),
  incrby: vi.fn(),
  pipeline: vi.fn(() => mockPipeline),
  on: vi.fn(),
}

const mockPipeline = {
  hset: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  lpush: vi.fn().mockReturnThis(),
  rpop: vi.fn().mockReturnThis(),
  exec: vi.fn(),
}

vi.mock('ioredis', () => ({
  default: vi.fn(() => mockRedis),
}))

vi.mock('./logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

describe('Redis — active crawls (multi-crawl)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('addActiveCrawl adds to Redis SET', async () => {
    const { addActiveCrawl } = await import('../../crawler/redis')
    await addActiveCrawl('crawl-1')
    expect(mockRedis.sadd).toHaveBeenCalledWith('crawl:active-set', 'crawl-1')
  })

  it('removeActiveCrawl removes from Redis SET', async () => {
    const { removeActiveCrawl } = await import('../../crawler/redis')
    await removeActiveCrawl('crawl-1')
    expect(mockRedis.srem).toHaveBeenCalledWith('crawl:active-set', 'crawl-1')
  })

  it('getActiveCrawls returns all members', async () => {
    mockRedis.smembers.mockResolvedValue(['crawl-1', 'crawl-2', 'crawl-3'])
    const { getActiveCrawls } = await import('../../crawler/redis')
    const result = await getActiveCrawls()
    expect(result).toEqual(['crawl-1', 'crawl-2', 'crawl-3'])
  })

  it('getActiveCrawlCount returns SET cardinality', async () => {
    mockRedis.scard.mockResolvedValue(5)
    const { getActiveCrawlCount } = await import('../../crawler/redis')
    const count = await getActiveCrawlCount()
    expect(count).toBe(5)
  })

  it('getActiveCrawlCount returns 0 when no active crawls', async () => {
    mockRedis.scard.mockResolvedValue(0)
    const { getActiveCrawlCount } = await import('../../crawler/redis')
    const count = await getActiveCrawlCount()
    expect(count).toBe(0)
  })
})

describe('Redis — distribution lock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('claimDistributionLock uses SET NX with 5 min TTL', async () => {
    mockRedis.set.mockResolvedValue('OK')
    const { claimDistributionLock } = await import('../../crawler/redis')
    const result = await claimDistributionLock('crawl-1')
    expect(result).toBe(true)
    expect(mockRedis.set).toHaveBeenCalledWith('crawl:distributing', 'crawl-1', 'EX', 300, 'NX')
  })

  it('claimDistributionLock returns false when lock taken', async () => {
    mockRedis.set.mockResolvedValue(null)
    const { claimDistributionLock } = await import('../../crawler/redis')
    const result = await claimDistributionLock('crawl-2')
    expect(result).toBe(false)
  })

  it('clearDistributionLock uses Lua for atomic conditional delete', async () => {
    mockRedis.eval.mockResolvedValue(1)
    const { clearDistributionLock } = await import('../../crawler/redis')
    await clearDistributionLock('crawl-1')
    expect(mockRedis.eval).toHaveBeenCalledWith(
      expect.stringContaining('redis.call("get"'),
      1,
      'crawl:distributing',
      'crawl-1',
    )
  })

  it('clearDistributionLock does NOT delete another workers lock', async () => {
    // Lua script returns 0 when value doesn't match
    mockRedis.eval.mockResolvedValue(0)
    const { clearDistributionLock } = await import('../../crawler/redis')
    await clearDistributionLock('crawl-wrong')
    // eval is called but returns 0 — lock NOT deleted
    expect(mockRedis.eval).toHaveBeenCalled()
    expect(mockRedis.del).not.toHaveBeenCalled()
  })
})

describe('Redis — queue operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getRemainingPages returns queue length', async () => {
    mockRedis.llen.mockResolvedValue(42000)
    const { getRemainingPages } = await import('../../crawler/redis')
    const remaining = await getRemainingPages('crawl-1')
    expect(remaining).toBe(42000)
  })

  it('getRemainingPages returns 0 for empty queue', async () => {
    mockRedis.llen.mockResolvedValue(0)
    const { getRemainingPages } = await import('../../crawler/redis')
    const remaining = await getRemainingPages('crawl-1')
    expect(remaining).toBe(0)
  })
})

describe('Redis — popPageBatch (RPOP natif)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pops N pages with a single RPOP command', async () => {
    mockRedis.rpop.mockResolvedValue(['https://example.com/a', 'https://example.com/b', 'https://example.com/c'])
    const { popPageBatch } = await import('../../crawler/redis')
    const urls = await popPageBatch('crawl-1', 10)

    expect(urls).toEqual(['https://example.com/a', 'https://example.com/b', 'https://example.com/c'])
    expect(mockRedis.rpop).toHaveBeenCalledWith('crawl:crawl-1:pages', 10)
  })

  it('increments dequeued counter after popping', async () => {
    mockRedis.rpop.mockResolvedValue(['https://example.com/a', 'https://example.com/b'])
    const { popPageBatch } = await import('../../crawler/redis')
    await popPageBatch('crawl-1', 5)

    expect(mockRedis.incrby).toHaveBeenCalledWith('crawl:crawl-1:dequeued', 2)
  })

  it('returns empty array when queue is empty', async () => {
    mockRedis.rpop.mockResolvedValue(null)
    const { popPageBatch } = await import('../../crawler/redis')
    const urls = await popPageBatch('crawl-1', 10)

    expect(urls).toEqual([])
    expect(mockRedis.incrby).not.toHaveBeenCalled()
  })

  it('returns empty array when rpop returns empty array', async () => {
    mockRedis.rpop.mockResolvedValue([])
    const { popPageBatch } = await import('../../crawler/redis')
    const urls = await popPageBatch('crawl-1', 10)

    expect(urls).toEqual([])
    expect(mockRedis.incrby).not.toHaveBeenCalled()
  })
})
