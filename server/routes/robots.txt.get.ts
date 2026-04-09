export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'
  let hostname: string
  try { hostname = new URL(appUrl).hostname } catch { hostname = 'seogard.io' }

  const host = getRequestHost(event)
  const isProd = host === hostname || host === `www.${hostname}`

  if (!isProd) {
    return `User-agent: *\nDisallow: /\n`
  }

  return `User-agent: *
Allow: /
Allow: /blog/
Allow: /llms.txt
Allow: /llms-full.txt
Disallow: /dashboard/
Disallow: /api/
Disallow: /login
Disallow: /register

Sitemap: ${appUrl}/sitemap.xml

# Block low-value scrapers
User-agent: Bytespider
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10

User-agent: GPTBot
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /login
Disallow: /register

User-agent: Claude-Web
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /login
Disallow: /register

User-agent: ClaudeBot
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /login
Disallow: /register

User-agent: anthropic-ai
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /login
Disallow: /register

User-agent: CCBot
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /login
Disallow: /register

User-agent: PerplexityBot
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /login
Disallow: /register

User-agent: Google-Extended
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /login
Disallow: /register
`
})
