import { Article } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

  const articles = await Article.find()
    .select('slug date updatedAt')
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

  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
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
${[...staticUrls, ...blogUrls].join('\n')}
</urlset>`

  setResponseHeader(event, 'content-type', 'application/xml')
  return xml
})
