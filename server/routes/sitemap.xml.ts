export default defineEventHandler(async (event) => {
  const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

  // Blog auto-généré supprimé (2026-06-25) → pivot Formations. Plus aucune URL d'article :
  // le sitemap ne sert que les pages statiques maîtrisées. /blog redirige en 301 vers /formations
  // (routeRules), donc on ne le liste plus ici.
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/formations', priority: '0.9', changefreq: 'weekly' },
    { loc: '/outils/monitoring', priority: '0.9', changefreq: 'monthly' },
    { loc: '/outils/audit', priority: '0.9', changefreq: 'monthly' },
    { loc: '/scanner', priority: '0.9', changefreq: 'monthly' },
    { loc: '/tarifs', priority: '0.8', changefreq: 'monthly' },
    { loc: '/docs/rules', priority: '0.7', changefreq: 'monthly' },
    { loc: '/docs/self-hosted', priority: '0.7', changefreq: 'monthly' },
    { loc: '/bot', priority: '0.5', changefreq: 'monthly' },
  ]

  const staticUrls = staticPages.map(page =>
    `  <url>
    <loc>${appUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.join('\n')}
</urlset>`

  setResponseHeader(event, 'content-type', 'application/xml')
  return xml
})
