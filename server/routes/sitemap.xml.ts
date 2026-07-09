import { localizedPath } from '../../shared/utils/i18n'

export default defineEventHandler(async (event) => {
  const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

  // Uniquement des URLs finales en 200 (jamais une redirection ni une page noindex). Le slug EN
  // peut différer du FR (via localizedPath). Les pages FR-only ne sont pas déclarées côté /en.
  const bilingual = [
    { path: '', priority: '1.0', changefreq: 'weekly' },
    { path: '/outils/monitoring', priority: '0.9', changefreq: 'monthly' },
    { path: '/outils/audit', priority: '0.9', changefreq: 'monthly' },
    { path: '/scanner', priority: '0.9', changefreq: 'monthly' },
    { path: '/tarifs', priority: '0.8', changefreq: 'monthly' },
    { path: '/docs/rules', priority: '0.7', changefreq: 'monthly' },
    { path: '/docs/self-hosted', priority: '0.7', changefreq: 'monthly' },
    { path: '/bot', priority: '0.5', changefreq: 'monthly' },
  ]
  const frOnly = [
    { path: '/formations', priority: '0.9', changefreq: 'weekly' },
  ]

  const hreflangBlock = (frPath: string, enPath: string) => `
    <xhtml:link rel="alternate" hreflang="fr" href="${appUrl}/fr${frPath}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${appUrl}/en${enPath}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${appUrl}/fr${frPath}"/>`

  const urls: string[] = []
  for (const page of bilingual) {
    const paths = { fr: page.path, en: localizedPath(page.path, 'en') }
    for (const locale of ['fr', 'en'] as const) {
      urls.push(`  <url>
    <loc>${appUrl}/${locale}${paths[locale]}</loc>${hreflangBlock(paths.fr, paths.en)}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
    }
  }
  const frOnlyHreflang = (path: string) => `
    <xhtml:link rel="alternate" hreflang="fr" href="${appUrl}/fr${path}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${appUrl}/fr${path}"/>`
  for (const page of frOnly) {
    urls.push(`  <url>
    <loc>${appUrl}/fr${page.path}</loc>${frOnlyHreflang(page.path)}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`

  setResponseHeader(event, 'content-type', 'application/xml')
  return xml
})
