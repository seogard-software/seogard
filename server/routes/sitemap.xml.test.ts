import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockArticleFind = vi.fn()

vi.mock('~~/server/database/models', () => ({
  Article: { find: (...a: unknown[]) => mockArticleFind(...a) },
}))
vi.mock('~~/server/api/public/articles/categories.get', () => ({
  CATEGORY_MIN_ARTICLES: 3,
}))

vi.stubGlobal('defineEventHandler', (handler: (e: unknown) => unknown) => handler)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { appUrl: 'https://seogard.io' } }))
vi.stubGlobal('setResponseHeader', vi.fn())

const fakeEvent = {} as unknown

describe('GET /sitemap.xml — pages statiques', () => {
  let handler: (e: unknown) => Promise<string>

  beforeEach(async () => {
    vi.clearAllMocks()
    // Article.find().select().sort().lean() → aucun article (on ne teste que les pages statiques)
    mockArticleFind.mockReturnValue({
      select: () => ({ sort: () => ({ lean: () => Promise.resolve([]) }) }),
    })
    handler = (await import('./sitemap.xml')).default as typeof handler
  })

  it('inclut les pages-cibles sitelinks (scanner, tarifs, docs, règles, self-hosted)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).toContain('https://seogard.io/scanner')
    expect(xml).toContain('https://seogard.io/tarifs')
    expect(xml).toContain('https://seogard.io/docs')
    expect(xml).toContain('https://seogard.io/docs/rules')
    expect(xml).toContain('https://seogard.io/docs/self-hosted')
  })

  it('ne contient aucune ancre # (inéligible aux sitelinks)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).not.toContain('#')
  })
})
