import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()
const mockCountDocuments = vi.fn()

vi.mock('~~/server/database/models', () => ({
  Article: {
    find: (...args: unknown[]) => mockFind(...args),
    countDocuments: (...args: unknown[]) => mockCountDocuments(...args),
  },
}))

const handler = (await import('./index.get')).default

function createEvent(query: Record<string, string> = {}) {
  return {
    node: { req: { url: '/api/public/articles?' + new URLSearchParams(query).toString() } },
    context: {},
    _query: query,
  } as unknown as Parameters<typeof handler>[0]
}

// Mock h3 getQuery
vi.mock('h3', () => ({
  getQuery: (event: { _query: Record<string, string> }) => event._query || {},
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/public/articles', () => {
  it('returns paginated articles without body/htmlContent', async () => {
    const articles = [
      { _id: '1', title: 'Article 1', slug: 'article-1', date: '2026-03-01' },
      { _id: '2', title: 'Article 2', slug: 'article-2', date: '2026-02-28' },
    ]

    mockFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(articles),
            }),
          }),
        }),
      }),
    })
    mockCountDocuments.mockResolvedValue(2)

    const result = await handler(createEvent())

    expect(result.articles).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
    expect(mockFind).toHaveBeenCalledWith({})
  })

  it('filters by category', async () => {
    mockFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    })
    mockCountDocuments.mockResolvedValue(0)

    await handler(createEvent({ category: 'Rendering' }))

    expect(mockFind).toHaveBeenCalledWith({ category: 'Rendering' })
    expect(mockCountDocuments).toHaveBeenCalledWith({ category: 'Rendering' })
  })

  it('paginates correctly', async () => {
    mockFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    })
    mockCountDocuments.mockResolvedValue(120)

    const result = await handler(createEvent({ page: '3', limit: '10' }))

    expect(result.page).toBe(3)
    expect(result.totalPages).toBe(12)
  })

  it('clamps limit to max 100', async () => {
    mockFind.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    })
    mockCountDocuments.mockResolvedValue(0)

    const result = await handler(createEvent({ limit: '999' }))

    expect(result.totalPages).toBe(0)
    // Verify limit was clamped by checking the chain
    const selectMock = mockFind.mock.results[0].value.select
    const sortMock = selectMock.mock.results[0].value.sort
    const skipMock = sortMock.mock.results[0].value.skip
    const limitMock = skipMock.mock.results[0].value.limit
    expect(limitMock).toHaveBeenCalledWith(100)
  })
})
