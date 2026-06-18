import { Article } from '~~/server/database/models'
import { BLOG_PAGE_SIZE, categorySlug } from '~~/shared/utils/blog'
import { CATEGORY_MIN_ARTICLES } from '~~/server/api/public/articles/categories.get'

export default defineEventHandler(async (event) => {
  const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

  // Une seule requête : sert les URLs d'articles, la pagination et les hubs catégories.
  const articles = await Article.find()
    .select('slug date updatedAt category')
    .sort({ date: -1 })
    .lean()

  const blogUrls = articles.map(article =>
    `  <url>
    <loc>${appUrl}/blog/${article.slug}</loc>
    <lastmod>${new Date(article.date).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
  )

  // Pagination du listing principal : /blog/page/2…N (page 1 = /blog, déjà en statique).
  const totalPages = Math.max(1, Math.ceil(articles.length / BLOG_PAGE_SIZE))
  const paginationUrls: string[] = []
  for (let p = 2; p <= totalPages; p++) {
    paginationUrls.push(
      `  <url>
    <loc>${appUrl}/blog/page/${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`,
    )
  }

  // Hubs catégories (curés par seuil) + leur pagination.
  const counts = new Map<string, number>()
  for (const a of articles) {
    if (a.category) counts.set(a.category, (counts.get(a.category) ?? 0) + 1)
  }
  const hubUrls: string[] = []
  const seenSlugs = new Set<string>()
  for (const [category, count] of counts) {
    if (count < CATEGORY_MIN_ARTICLES) continue
    const slug = categorySlug(category)
    if (!slug || seenSlugs.has(slug)) continue
    seenSlugs.add(slug)
    hubUrls.push(
      `  <url>
    <loc>${appUrl}/blog/categorie/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    const catPages = Math.max(1, Math.ceil(count / BLOG_PAGE_SIZE))
    for (let p = 2; p <= catPages; p++) {
      hubUrls.push(
        `  <url>
    <loc>${appUrl}/blog/categorie/${slug}/page/${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`,
      )
    }
  }

  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/scanner', priority: '0.9', changefreq: 'monthly' },
    { loc: '/tarifs', priority: '0.8', changefreq: 'monthly' },
    { loc: '/blog', priority: '0.8', changefreq: 'daily' },
    { loc: '/docs', priority: '0.7', changefreq: 'monthly' },
    { loc: '/docs/rules', priority: '0.7', changefreq: 'monthly' },
    { loc: '/docs/self-hosted', priority: '0.7', changefreq: 'monthly' },
    { loc: '/bot', priority: '0.5', changefreq: 'monthly' },
    { loc: '/legal/cgu', priority: '0.3', changefreq: 'yearly' },
    { loc: '/legal/cgv', priority: '0.3', changefreq: 'yearly' },
    { loc: '/legal/privacy', priority: '0.3', changefreq: 'yearly' },
    { loc: '/legal/mentions', priority: '0.3', changefreq: 'yearly' },
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
${[...staticUrls, ...hubUrls, ...paginationUrls, ...blogUrls].join('\n')}
</urlset>`

  setResponseHeader(event, 'content-type', 'application/xml')
  return xml
})
