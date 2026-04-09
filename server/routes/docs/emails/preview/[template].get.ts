import {
  welcomeTemplate,
  alertCriticalTemplate,
  dailyDigestTemplate,
  logDigestTemplate,
  sitemapBlockedTemplate,
  crawlerBlockedTemplate,
  resetPasswordTemplate,
  sitemapEstimateTemplate,
  paymentFailedTemplate,
  inviteTemplate,
} from '../../../../utils/email-templates'

export default defineEventHandler((event) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 404 })
  }

  const template = getRouterParam(event, 'template')
  const APP_URL = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'

  let result: { subject: string; html: string }

  switch (template) {
    case 'welcome':
      result = welcomeTemplate()
      break

    case 'alert-critical':
      result = alertCriticalTemplate({
        siteName: 'Les Numériques',
        siteId: 'site123',
        zoneName: 'Blog',
        zoneId: 'zone456',
        criticalCount: 3,
        warningCount: 7,
        alerts: [
          { pageUrl: 'https://www.lesnumeriques.com/ordinateur-portable/test.html', type: 'meta_description_missing', severity: 'critical', message: 'Meta description manquante' },
          { pageUrl: 'https://www.lesnumeriques.com/smartphone/iphone-test.html', type: 'meta_title_missing', severity: 'critical', message: 'Meta title supprimé' },
          { pageUrl: 'https://www.lesnumeriques.com/tv/samsung.html', type: 'duplicate_title', severity: 'warning', message: 'Titre dupliqué sur 3 pages' },
        ],
      })
      break

    case 'daily-digest':
      result = dailyDigestTemplate({
        siteName: 'Presse-Citron',
        siteId: 'site789',
        totalPages: 86530,
        regressionCount: 4,
        regressions: [
          { type: 'h1_missing', message: 'H1 manquant', pageUrl: 'https://www.presse-citron.net/test-article' },
          { type: 'canonical_missing', message: 'Canonical manquant', pageUrl: 'https://www.presse-citron.net/guide' },
          { type: 'slow_ttfb', message: 'TTFB > 1s (1.8s)', pageUrl: 'https://www.presse-citron.net/review' },
          { type: 'broken_image', message: 'Image cassée', pageUrl: 'https://www.presse-citron.net/news' },
        ],
      })
      break

    case 'daily-digest-ok':
      result = dailyDigestTemplate({
        siteName: 'Seogard.io',
        siteId: 'site000',
        totalPages: 42,
        regressionCount: 0,
        regressions: [],
      })
      break

    case 'log-digest':
      result = logDigestTemplate({
        totalWarn: 12,
        totalError: 3,
        totalFatal: 1,
        groups: [
          { level: 'fatal', module: 'crawler', errorCode: 'DB_CONNECTION_FAILED', message: 'Impossible de se connecter à MongoDB', count: 1, samples: ['worker-3 at 08:14:22'] },
          { level: 'error', module: 'sitemap', errorCode: 'SITEMAP_PARSE_ERROR', message: 'Sitemap XML invalide', count: 2, samples: ['https://example.com/sitemap.xml', 'https://autre.com/sitemap.xml'] },
          { level: 'warn', module: 'crawler', errorCode: 'CRAWL_TIMEOUT', message: 'Crawl timeout après 30s', count: 12, samples: ['https://lent.com/page-1', 'https://lent.com/page-2'] },
        ],
      })
      break

    case 'sitemap-blocked':
      result = sitemapBlockedTemplate({
        siteName: 'Mon E-commerce',
        siteUrl: 'https://www.monsite.fr',
      })
      break

    case 'crawler-blocked':
      result = crawlerBlockedTemplate({
        siteName: 'Mon E-commerce',
        pagesBlocked: 12450,
        pagesTotal: 15000,
      })
      break

    case 'reset-password':
      result = resetPasswordTemplate(`${APP_URL}/reset-password?token=fake-token-for-preview-only`)
      break

    case 'sitemap-estimate':
      result = sitemapEstimateTemplate({
        url: 'https://www.presse-citron.net',
        pageCount: 8200,
        price: '57 €',
        sitemapUrl: 'https://www.presse-citron.net/sitemap_index.xml',
      })
      break

    case 'sitemap-estimate-large':
      result = sitemapEstimateTemplate({
        url: 'https://www.lesnumeriques.com',
        pageCount: 176000,
        price: '1 232 €',
        sitemapUrl: 'https://www.lesnumeriques.com/sitemap_index.xml',
      })
      break

    case 'payment-failed':
      result = paymentFailedTemplate('org123')
      break

    case 'invite':
      result = inviteTemplate('Acme Corp', 'member', `${APP_URL}/invite/fake-token-for-preview`)
      break

    default:
      throw createError({ statusCode: 404, message: `Template "${template}" inconnu` })
  }

  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  // Inject subject banner at the top for dev preview
  let preview = result.html.replace(
    '<body',
    `<body><div style="background:#f3f4f6;border-bottom:1px solid #e5e7eb;color:#111827;padding:10px 24px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;position:sticky;top:0;z-index:999;display:flex;align-items:center;gap:8px;"><span style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;flex-shrink:0;">Objet</span> <span style="font-weight:500;">${result.subject}</span></div`,
  )
  // Neutralize all links in preview — keep the visual but prevent navigation
  preview = preview.replace(/href="[^"]*"/g, 'href="#"')
  return preview
})
