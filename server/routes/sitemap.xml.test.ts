import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: (e: unknown) => unknown) => handler)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { appUrl: 'https://seogard.io' } }))
vi.stubGlobal('setResponseHeader', vi.fn())

const fakeEvent = {} as unknown

describe('GET /sitemap.xml — pages statiques (blog supprimé)', () => {
  let handler: (e: unknown) => Promise<string>

  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('./sitemap.xml')).default as typeof handler
  })

  it('inclut les pages-cibles sitelinks (formations, outils, scanner, tarifs, docs, règles, self-hosted)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).toContain('https://seogard.io/formations')
    expect(xml).toContain('https://seogard.io/outils/monitoring')
    expect(xml).toContain('https://seogard.io/outils/audit')
    expect(xml).toContain('https://seogard.io/scanner')
    expect(xml).toContain('https://seogard.io/tarifs')
    expect(xml).toContain('https://seogard.io/docs')
    expect(xml).toContain('https://seogard.io/docs/rules')
    expect(xml).toContain('https://seogard.io/docs/self-hosted')
  })

  it('ne contient plus aucune URL /blog (pivot Formations)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).not.toContain('/blog')
  })

  it('ne contient aucune ancre # (inéligible aux sitelinks)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).not.toContain('#')
  })
})
