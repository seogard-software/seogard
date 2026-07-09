import { test, expect } from '@playwright/test'

// Blog supprimé définitivement (2026-06-25, pivot Formations) : tout /blog renvoie 410 Gone
// — désindexation rapide, Google cesse de re-crawler. Couvre la racine, les articles et les
// préfixes de locale (le middleware 410 s'applique avant le routing i18n).
test.describe('Blog supprimé — 410 Gone partout', () => {
  test('/blog (racine) → 410', async ({ request }) => {
    const res = await request.get('/blog', { maxRedirects: 0 })
    expect(res.status()).toBe(410)
  })

  test('/blog/<slug> (ancien article) → 410', async ({ request }) => {
    const res = await request.get('/blog/seo-technique-2024', { maxRedirects: 0 })
    expect(res.status()).toBe(410)
  })

  test('/fr/blog et /en/blog → 410 aussi (préfixes de locale)', async ({ request }) => {
    expect((await request.get('/fr/blog', { maxRedirects: 0 })).status()).toBe(410)
    expect((await request.get('/en/blog/some-post', { maxRedirects: 0 })).status()).toBe(410)
  })

  test('les voisins ne sont pas touchés (/fr/formations vit)', async ({ request }) => {
    const res = await request.get('/fr/formations', { maxRedirects: 0 })
    expect(res.status()).toBe(200)
  })
})
