import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindOne = vi.fn()

vi.mock('~~/server/database/models', () => ({
  Article: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
  },
}))

// createError is a Nitro auto-import (global)
vi.stubGlobal('createError', (opts: { statusCode: number, message: string }) => {
  return Object.assign(new Error(opts.message), { statusCode: opts.statusCode })
})

// getRouterParam is a h3 auto-import (global)
let currentSlug = ''
vi.stubGlobal('getRouterParam', (_event: unknown, param: string) => {
  if (param === 'slug') return currentSlug
  return undefined
})

const handler = (await import('./[slug].get')).default

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/public/articles/:slug', () => {
  it('returns article by slug', async () => {
    currentSlug = 'ssr-vs-csr'
    const article = {
      _id: '1',
      title: 'SSR vs CSR',
      slug: 'ssr-vs-csr',
      body: '## Content',
      htmlContent: '<h2>Content</h2>',
    }
    mockFindOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(article) })

    const result = await handler({} as never)

    expect(result).toEqual(article)
    expect(mockFindOne).toHaveBeenCalledWith({ slug: 'ssr-vs-csr' })
  })

  it('throws 404 for unknown slug', async () => {
    currentSlug = 'nonexistent'
    mockFindOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

    try {
      await handler({} as never)
      expect.fail('should have thrown')
    }
    catch (err: unknown) {
      expect((err as { statusCode: number }).statusCode).toBe(404)
    }
  })

  it('throws 400 for missing slug', async () => {
    currentSlug = ''

    try {
      await handler({} as never)
      expect.fail('should have thrown')
    }
    catch (err: unknown) {
      expect((err as { statusCode: number }).statusCode).toBe(400)
    }
  })
})
