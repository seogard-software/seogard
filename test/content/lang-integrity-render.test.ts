import { describe, it, expect } from 'vitest'
import {
  welcomeTemplate, crawlReportTemplate, dailyDigestTemplate, logDigestTemplate,
  sitemapInvalidHostnameTemplate, sitemapBlockedTemplate, crawlerBlockedTemplate,
  resetPasswordTemplate, sitemapEstimateTemplate, paymentFailedTemplate, inviteTemplate,
} from '../../server/utils/email-templates'
import { buildZoneReport } from '../../server/utils/report-builder'
import { renderReportMarkdown } from '../../server/utils/report-markdown'
import type { Locale } from '../../shared/utils/i18n'

const LOCALES: Locale[] = ['fr', 'en']
// Uppercase + lowercase French accents (proper nouns tolerated).
const FR_ACCENT = /[àâäéèêëîïôöùûüçœÀÂÄÉÈÊËÎÏÔÖÙÛÜÇŒ]/g
const PROPER = ['Créteil', 'Aadil', 'Vitry', 'Camille']
// Unresolved i18n dot-keys that leaked into output (domain.rest).
const RAW_KEY = /\b(emails|report|rules|common|errors)\.[a-zA-Z][a-zA-Z0-9_.]*[a-zA-Z0-9]/g
// Leftover interpolation params {word} (ignore vue-i18n literal {'|'} which shouldn't appear server-side).
const RAW_PARAM = /\{[a-zA-Z][a-zA-Z0-9]*\}/g

function stripProper(s: string): string {
  let out = s
  for (const p of PROPER) out = out.split(p).join('')
  return out
}

// Strip <html lang="xx"> attr so an 'en' render isn't falsely accused via lang tag etc.
function scan(name: string, locale: Locale, subject: string, html: string) {
  const blob = `${subject}\n${html}`
  const rawKeys = blob.match(RAW_KEY) ?? []
  expect(rawKeys, `${name} [${locale}] raw i18n keys leaked`).toEqual([])
  const rawParams = (subject.match(RAW_PARAM) ?? []).concat(html.match(RAW_PARAM) ?? [])
  expect(rawParams, `${name} [${locale}] unresolved {params}`).toEqual([])
  if (locale === 'en') {
    const accents = stripProper(blob).match(FR_ACCENT) ?? []
    expect(accents, `${name} [en] French accents in EN render`).toEqual([])
  }
}

const crawlData = {
  siteName: 'Acme', siteId: 's1', zoneName: 'Blog', zoneId: 'z1',
  regressions: [
    { pageUrl: 'https://acme.test/a', severity: 'critical', message: 'Title missing' },
    { pageUrl: 'https://acme.test/b', severity: 'warning', message: 'H1 changed' },
  ],
  fixed: [{ pageUrl: 'https://acme.test/c', message: 'Canonical restored' }],
  topRecos: [{ ruleId: 'rec_img_alt_audit', label: 'Alt', hint: '', pagesAffected: 3, siteLevel: false }],
  recoCount: 5,
}

describe('email templates render clean in fr + en', () => {
  for (const locale of LOCALES) {
    it(`welcome [${locale}]`, () => { const { subject, html } = welcomeTemplate(locale); scan('welcome', locale, subject, html) })
    it(`crawlReport [${locale}]`, () => { const { subject, html } = crawlReportTemplate(crawlData, locale); scan('crawlReport', locale, subject, html) })
    it(`crawlReport fixed-only [${locale}]`, () => {
      const { subject, html } = crawlReportTemplate({ ...crawlData, regressions: [] }, locale)
      scan('crawlReport-fixed', locale, subject, html)
    })
    it(`dailyDigest ok [${locale}]`, () => {
      const { subject, html } = dailyDigestTemplate({ siteName: 'Acme', siteId: 's1', totalPages: 1200, regressionCount: 0, regressions: [] }, locale)
      scan('dailyDigest-ok', locale, subject, html)
    })
    it(`dailyDigest reg [${locale}]`, () => {
      const { subject, html } = dailyDigestTemplate({ siteName: 'Acme', siteId: 's1', totalPages: 1200, regressionCount: 2, regressions: [{ type: 't', message: 'X', pageUrl: 'u' }] }, locale)
      scan('dailyDigest-reg', locale, subject, html)
    })
    it(`logDigest [${locale}]`, () => {
      const { subject, html } = logDigestTemplate({ groups: [{ level: 'error', module: 'm', errorCode: 'E', message: 'boom', count: 3, samples: ['x'] }], totalWarn: 1, totalError: 3, totalFatal: 0 }, locale)
      scan('logDigest', locale, subject, html)
    })
    it(`sitemapInvalidHostname [${locale}]`, () => {
      const { subject, html } = sitemapInvalidHostnameTemplate({ siteName: 'Acme', siteUrl: 'https://acme.test', foreignHostnames: ['evil.com'], foreignUrlCount: 12 }, locale)
      scan('sitemapInvalidHostname', locale, subject, html)
    })
    it(`sitemapBlocked [${locale}]`, () => { const { subject, html } = sitemapBlockedTemplate({ siteName: 'Acme', siteUrl: 'https://acme.test' }, locale); scan('sitemapBlocked', locale, subject, html) })
    it(`crawlerBlocked [${locale}]`, () => { const { subject, html } = crawlerBlockedTemplate({ siteName: 'Acme', pagesBlocked: 30, pagesTotal: 100 }, locale); scan('crawlerBlocked', locale, subject, html) })
    it(`resetPassword [${locale}]`, () => { const { subject, html } = resetPasswordTemplate('https://acme.test/reset', locale); scan('resetPassword', locale, subject, html) })
    it(`sitemapEstimate [${locale}]`, () => {
      const { subject, html } = sitemapEstimateTemplate({ url: 'acme.test', pageCount: 60000, price: '600 €', sitemapUrl: 'https://acme.test/sitemap.xml' }, locale)
      scan('sitemapEstimate', locale, subject, html)
    })
    it(`paymentFailed [${locale}]`, () => { const { subject, html } = paymentFailedTemplate('org1', locale); scan('paymentFailed', locale, subject, html) })
    it(`invite [${locale}]`, () => { const { subject, html } = inviteTemplate('Acme Org', 'admin', 'https://acme.test/invite', locale); scan('invite', locale, subject, html) })
  }
})

describe('report markdown renders clean in fr + en', () => {
  for (const locale of LOCALES) {
    it(`markdown [${locale}]`, () => {
      const report = buildZoneReport({
        site: { name: 'Acme', domain: 'acme.test' },
        zone: { name: 'Blog', isDefault: false },
        crawl: { completedAt: '2026-07-01T10:00:00Z', pagesScanned: 100, pagesTotal: 100, pagesPurged: 2 },
        openAlerts: [
          { ruleId: 'meta_title_missing', pageUrl: 'https://acme.test/a', severity: 'critical', message: 'x', previousValue: 'Old', currentValue: null },
          { ruleId: 'rec_img_alt_audit', pageUrl: 'https://acme.test/b', severity: 'info', message: 'y' },
        ],
        repairedAlerts: [{ ruleId: 'h1_missing', pageUrl: 'https://acme.test/c' }],
        generatedAt: '2026-07-01T11:00:00Z',
        locale,
      })
      const md = renderReportMarkdown(report)
      const rawKeys = md.match(RAW_KEY) ?? []
      // report.md keys are language-agnostic dot-keys inside frontmatter? none should appear as raw t() misses
      expect(rawKeys.filter(k => !k.startsWith('report.severity') || false), `report md [${locale}] raw keys`).toEqual([])
      const rawParams = md.match(RAW_PARAM) ?? []
      expect(rawParams, `report md [${locale}] unresolved params`).toEqual([])
      if (locale === 'en') {
        const accents = stripProper(md).match(FR_ACCENT) ?? []
        expect(accents, `report md [en] French accents`).toEqual([])
      }
    })
  }
})
