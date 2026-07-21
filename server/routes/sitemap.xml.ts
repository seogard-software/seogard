import { localizedPath } from '../../shared/utils/i18n'
import { getPublishedRuleIds } from '../../shared/utils/rules-list'
import { getRuleSlug } from '../../shared/utils/rule-knowledge'

export default defineEventHandler(async (event) => {
  const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

  // Uniquement des URLs finales en 200 (jamais une redirection ni une page noindex). Le slug EN
  // peut différer du FR (via localizedPath). Toutes les pages publiques indexables sont bilingues.
  const bilingual = [
    { path: '', priority: '1.0', changefreq: 'weekly' },
    { path: '/outils/monitoring', priority: '0.9', changefreq: 'monthly' },
    { path: '/outils/audit', priority: '0.9', changefreq: 'monthly' },
    { path: '/scanner', priority: '0.9', changefreq: 'monthly' },
    { path: '/formations', priority: '0.9', changefreq: 'weekly' },
    { path: '/tarifs', priority: '0.8', changefreq: 'monthly' },
    { path: '/a-propos', priority: '0.6', changefreq: 'monthly' },
    { path: '/docs/rules', priority: '0.7', changefreq: 'monthly' },
    { path: '/docs/self-hosted', priority: '0.7', changefreq: 'monthly' },
    { path: '/bot', priority: '0.5', changefreq: 'monthly' },
    { path: '/alternative-oseox', priority: '0.7', changefreq: 'monthly' },
    { path: '/oseox-vs-seogard', priority: '0.7', changefreq: 'monthly' },
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

  // Fiches de règles publiées (slug traduit par locale). Vide tant qu'aucune vague n'est publiée.
  for (const id of getPublishedRuleIds()) {
    const frSlug = getRuleSlug(id, 'fr')
    const enSlug = getRuleSlug(id, 'en')
    if (!frSlug || !enSlug) continue
    const frPath = `/docs/rules/${frSlug}`
    const enPath = `/docs/rules/${enSlug}`
    const fichePaths = { fr: frPath, en: enPath }
    for (const locale of ['fr', 'en'] as const) {
      urls.push(`  <url>
    <loc>${appUrl}/${locale}${fichePaths[locale]}</loc>${hreflangBlock(frPath, enPath)}
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`

  setResponseHeader(event, 'content-type', 'application/xml')
  return xml
})
