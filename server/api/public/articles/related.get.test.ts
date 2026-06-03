import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFind = vi.fn()

vi.mock('~~/server/database/models', () => ({
  Article: {
    find: (...args: unknown[]) => mockFind(...args),
  },
}))

vi.mock('h3', () => ({
  getQuery: (event: { _query: Record<string, string> }) => event._query || {},
}))

// createError est un auto-import Nitro (global) — on le stub comme les tests voisins.
vi.stubGlobal('createError', (opts: { statusCode: number, message: string }) =>
  Object.assign(new Error(opts.message), { statusCode: opts.statusCode }))

const handler = (await import('./related.get')).default

function createEvent(query: Record<string, string> = {}) {
  return { _query: query, context: {} } as unknown as Parameters<typeof handler>[0]
}

// Chaîne mongoose .select().sort().limit().lean() résolvant `rows`.
function chain(rows: unknown[]) {
  return {
    select: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(rows),
        }),
      }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/public/articles/related', () => {
  it('exige une catégorie (400 sinon)', async () => {
    await expect(handler(createEvent({ exclude: 'x' }))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('retourne les articles de la même catégorie (sans fallback si assez)', async () => {
    const sameCat = Array.from({ length: 6 }, (_, i) => ({ slug: `a-${i}`, category: 'GEO' }))
    mockFind.mockReturnValueOnce(chain(sameCat))

    const result = await handler(createEvent({ category: 'GEO', exclude: 'cur', limit: '6' }))

    expect(result).toHaveLength(6)
    expect(mockFind).toHaveBeenCalledTimes(1)
    expect(mockFind).toHaveBeenCalledWith({ category: 'GEO', slug: { $nin: ['cur'] } })
  })

  it('complète par récence si la catégorie est pauvre, en excluant courant + déjà retenus', async () => {
    const sameCat = [{ slug: 'a-0', category: 'GEO' }, { slug: 'a-1', category: 'GEO' }]
    const fill = [{ slug: 'b-0', category: 'SEO' }, { slug: 'b-1', category: 'Perf' }]
    mockFind.mockReturnValueOnce(chain(sameCat)).mockReturnValueOnce(chain(fill))

    const result = await handler(createEvent({ category: 'GEO', exclude: 'cur', limit: '6' }))

    expect(result.map(a => a.slug)).toEqual(['a-0', 'a-1', 'b-0', 'b-1'])
    expect(mockFind).toHaveBeenCalledTimes(2)
    expect(mockFind).toHaveBeenLastCalledWith({
      category: { $ne: 'GEO' },
      slug: { $nin: ['cur', 'a-0', 'a-1'] },
    })
  })

  it('plafonne limit à 6', async () => {
    mockFind.mockReturnValueOnce(chain([]))
    mockFind.mockReturnValueOnce(chain([]))
    await handler(createEvent({ category: 'GEO', limit: '99' }))
    // 1er appel : .limit(6)
    const firstChain = mockFind.mock.results[0].value
    const limitMock = firstChain.select.mock.results[0].value.sort.mock.results[0].value.limit
    expect(limitMock).toHaveBeenCalledWith(6)
  })
})
