import { Article } from '../../database/models'

function escapeXml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc2822(date: Date | string): string {
  return new Date(date).toUTCString()
}

export default defineEventHandler(async (event) => {
  const articles = await Article.find()
    .sort({ date: -1 })
    .limit(20)
    .select('title description slug date category')
    .lean()

  const baseUrl = 'https://seogard.io'
  const now = toRfc2822(new Date())

  const items = articles.map(article => `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${baseUrl}/blog/${article.slug}</link>
      <description>${escapeXml(article.description)}</description>
      <pubDate>${toRfc2822(article.date)}</pubDate>
      <guid isPermaLink="true">${baseUrl}/blog/${article.slug}</guid>
      <category>${escapeXml(article.category)}</category>
    </item>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SEOGARD Blog</title>
    <description>Monitoring SEO &amp; GEO technique</description>
    <link>${baseUrl}/blog</link>
    <atom:link href="${baseUrl}/api/public/rss" rel="self" type="application/rss+xml"/>
    <language>fr</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')

  return xml
})
