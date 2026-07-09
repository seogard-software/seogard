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

  it('inclut les pages-cibles sitelinks (formations, outils, scanner, tarifs, règles, self-hosted)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).toContain('https://seogard.io/fr/formations')
    expect(xml).toContain('https://seogard.io/fr/outils/monitoring')
    expect(xml).toContain('https://seogard.io/fr/outils/audit')
    expect(xml).toContain('https://seogard.io/fr/scanner')
    expect(xml).toContain('https://seogard.io/fr/tarifs')
    expect(xml).toContain('https://seogard.io/fr/docs/rules')
    expect(xml).toContain('https://seogard.io/fr/docs/self-hosted')
  })

  it('ne contient plus aucune URL /blog (pivot Formations)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).not.toContain('/blog')
  })

  it('TOUTES les URLs sont sous /fr/ ou /en/ (jamais une URL racine qui redirige)', async () => {
    const xml = await handler(fakeEvent)
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    expect(locs.length).toBeGreaterThan(0)
    for (const loc of locs) {
      expect(/^https:\/\/seogard\.io\/(fr|en)(\/|$)/.test(loc), `${loc} devrait être sous /fr ou /en`).toBe(true)
    }
  })

  it('bascule EN : la home et le scanner existent dans les deux locales avec hreflang bidirectionnel', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).toContain('<loc>https://seogard.io/en</loc>')
    expect(xml).toContain('<loc>https://seogard.io/en/scanner</loc>')
    expect(xml).toContain('hreflang="x-default" href="https://seogard.io/fr"')
  })

  it('slugs EN traduits : /en/tools/monitoring et /en/pricing (pas les slugs FR sous /en)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).toContain('<loc>https://seogard.io/en/tools/monitoring</loc>')
    expect(xml).toContain('<loc>https://seogard.io/en/pricing</loc>')
    expect(xml).not.toContain('<loc>https://seogard.io/en/outils/monitoring</loc>')
    expect(xml).not.toContain('<loc>https://seogard.io/en/tarifs</loc>')
    // hreflang croisé : la version EN traduite pointe vers la FR d'origine
    expect(xml).toContain('hreflang="en" href="https://seogard.io/en/tools/monitoring"')
    expect(xml).toContain('hreflang="fr" href="https://seogard.io/fr/outils/monitoring"')
  })

  it('formations : bilingue (FR + EN traduits) avec hreflang', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).toContain('<loc>https://seogard.io/fr/formations</loc>')
    expect(xml).toContain('<loc>https://seogard.io/en/formations</loc>')
    expect(xml).toContain('hreflang="en" href="https://seogard.io/en/formations"')
  })

  it('ne déclare pas /docs (pivot 301 → /docs/rules : jamais une URL qui redirige au sitemap)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).not.toContain('<loc>https://seogard.io/fr/docs</loc>')
  })

  it('ne déclare aucune page /legal (noindex volontaire : jamais une page noindex au sitemap)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).not.toContain('/legal')
  })

  it('ne contient aucune ancre # (inéligible aux sitelinks)', async () => {
    const xml = await handler(fakeEvent)
    expect(xml).not.toContain('#')
  })
})
