import { test, expect } from '@playwright/test'

// Maillage interne : on vérifie les liens dans le HTML BRUT (SSR), récupéré via la
// Request API qui n'exécute PAS le JavaScript — exactement ce que voient Google au 1er
// crawl et les crawlers IA. Pages publiques : pas d'auth requise.
test.describe('Blog — maillage interne SSR (HTML brut, sans JS)', () => {
  test('/blog : liens articles + pagination + hubs en <a href>', async ({ request }) => {
    const html = await (await request.get('/blog')).text()
    expect(html).toMatch(/href="\/blog\/article-test-\d+"/)
    expect(html).toContain('href="/blog/page/2"')
    expect(html).toContain('href="/blog/categorie/')
  })

  test('/blog/page/2 : liens articles + canonical auto-référent', async ({ request }) => {
    const res = await request.get('/blog/page/2')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toMatch(/href="\/blog\/article-test-\d+"/)
    expect(html).toContain('rel="canonical"')
    expect(html).toContain('https://seogard.io/blog/page/2')
  })

  test('/blog/page/1 → 301 vers /blog (anti-doublon)', async ({ request }) => {
    const res = await request.get('/blog/page/1', { maxRedirects: 0 })
    expect(res.status()).toBe(301)
    expect(res.headers()['location']?.endsWith('/blog')).toBe(true)
  })

  test('/blog/page/9999 (hors-borne) → 404', async ({ request }) => {
    const res = await request.get('/blog/page/9999')
    expect(res.status()).toBe(404)
  })

  test('hub catégorie : articles en SSR + canonical auto-référent', async ({ request }) => {
    const res = await request.get('/blog/categorie/rendering-ssr')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toMatch(/href="\/blog\/article-test-\d+"/)
    expect(html).toContain('https://seogard.io/blog/categorie/rendering-ssr')
  })

  test('hub inconnu → 404 (pas de crawl trap)', async ({ request }) => {
    const res = await request.get('/blog/categorie/categorie-inexistante-xyz')
    expect(res.status()).toBe(404)
  })

  test('article : liens « connexes » en SSR + BreadcrumbList JSON-LD', async ({ request }) => {
    const html = await (await request.get('/blog/article-test-1')).text()
    // au moins un lien vers un autre article (connexes rendus côté serveur)
    expect(html).toMatch(/href="\/blog\/article-test-[2-9]"/)
    expect(html).toContain('"@type":"BreadcrumbList"')
  })
})
