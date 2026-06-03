import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAggregate = vi.fn()

vi.mock('~~/server/database/models', () => ({
  Article: {
    aggregate: (...args: unknown[]) => mockAggregate(...args),
  },
}))

const handler = (await import('./categories.get')).default
const { CATEGORY_MIN_ARTICLES } = await import('./categories.get')

function createEvent() {
  return { node: { req: { url: '/api/public/articles/categories' } }, context: {} } as unknown as Parameters<typeof handler>[0]
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/public/articles/categories', () => {
  it('retourne les catégories avec slug + count, triées', async () => {
    mockAggregate.mockResolvedValue([
      { _id: 'Référencement', count: 12 },
      { _id: 'SSR & CSR', count: 5 },
    ])

    const result = await handler(createEvent())

    expect(result.categories).toEqual([
      { category: 'Référencement', slug: 'referencement', count: 12 },
      { category: 'SSR & CSR', slug: 'ssr-csr', count: 5 },
    ])
  })

  it('applique le seuil CATEGORY_MIN_ARTICLES dans le $match', async () => {
    mockAggregate.mockResolvedValue([])
    await handler(createEvent())
    const pipeline = mockAggregate.mock.calls[0][0] as Array<Record<string, unknown>>
    const match = pipeline.find(stage => '$match' in stage) as { $match: { count: { $gte: number } } }
    expect(match.$match.count.$gte).toBe(CATEGORY_MIN_ARTICLES)
  })

  it('dédoublonne les slugs en collision (garde la première)', async () => {
    mockAggregate.mockResolvedValue([
      { _id: 'SEO Technique', count: 8 },
      { _id: 'SEO  technique', count: 4 },
    ])

    const result = await handler(createEvent())

    expect(result.categories).toHaveLength(1)
    expect(result.categories[0]).toMatchObject({ category: 'SEO Technique', slug: 'seo-technique' })
  })

  it('ignore les catégories vides/nulles', async () => {
    mockAggregate.mockResolvedValue([
      { _id: '', count: 9 },
      { _id: 'Indexation', count: 6 },
    ])

    const result = await handler(createEvent())

    expect(result.categories).toEqual([
      { category: 'Indexation', slug: 'indexation', count: 6 },
    ])
  })
})
