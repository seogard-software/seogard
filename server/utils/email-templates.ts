import type { TopReco } from '../../shared/utils/recommendations'
import { getAlertTypeLabels } from '../../shared/utils/constants'
import type { Locale } from '../../shared/utils/i18n'
import { DEFAULT_LOCALE } from '../../shared/utils/i18n'
import { getCloudPricePerPage } from '../../shared/utils/pricing'
import { INTL_LOCALE } from '../../shared/utils/format'
import { zoneReportPath } from '../../shared/utils/report-links'
import { t } from './i18n'

const APP_URL = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'

// Design tokens — alignés sur variables.scss
const C = {
  // Brand
  accent: '#111827',      // $color-accent — charcoal (CTA, header, liens)
  accentLight: '#374151', // $color-accent-light

  // Grays
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',

  // Semantic
  success: '#16a34a',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  warning: '#ea580c',
  warningBg: '#fff7ed',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#4338ca',
  infoBg: '#eef2ff',

  // Surfaces
  page: '#f4f4f4',    // $surface-page
  card: '#ffffff',
  elevated: '#f9fafb',

  white: '#ffffff',
  black: '#000000',
}

// Sélecteur de clé plurielle : les libellés FR/EN vivent en deux variantes one/many
// dans i18n/locales/<locale>/emails.json (remplace l'ancien suffixe manuel « s »).
function nKey(n: number): 'one' | 'many' {
  return n > 1 ? 'many' : 'one'
}

function layout(content: string, locale: Locale): string {
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${C.page};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.page};">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${C.card};border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

        <!-- Header — blanc, wordmark noir, bordure basse -->
        <tr><td style="background-color:${C.card};padding:24px 32px;border-bottom:1px solid ${C.gray200};">
          <span style="color:${C.gray900};font-size:20px;font-weight:600;letter-spacing:-0.03em;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;line-height:1;">Seogard<span style="color:${C.gray900};">.io</span></span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;color:${C.gray900};font-size:15px;line-height:1.65;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;background-color:${C.gray50};border-top:1px solid ${C.gray200};text-align:center;font-size:12px;color:${C.gray500};font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
          <a href="${APP_URL}" style="color:${C.gray700};text-decoration:none;font-weight:500;">seogard.io</a>
          &nbsp;·&nbsp;
          <a href="mailto:support@seogard.io" style="color:${C.gray700};text-decoration:none;font-weight:500;">Support</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background-color:${C.accent};border-radius:8px;">
      <a href="${href}" style="color:${C.white};text-decoration:none;font-weight:600;font-size:14px;display:inline-block;padding:13px 28px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">${label}</a>
    </td></tr>
  </table>`
}

// Bouton secondaire (contour) : discret mais beau et visible. Pour les CTA complémentaires.
function ghostButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td style="border:1.5px solid ${C.gray200};border-radius:8px;">
      <a href="${href}" style="color:${C.accent};text-decoration:none;font-weight:600;font-size:14px;display:inline-block;padding:11px 26px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">${label}</a>
    </td></tr>
  </table>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${C.gray200};margin:24px 0;">`
}

function infoBox(content: string, color = C.gray700, bg = C.gray100, border = C.gray200): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid ${border};border-radius:8px;background-color:${bg};">
    <tr><td style="padding:16px 20px;font-size:14px;color:${color};line-height:1.6;">${content}</td></tr>
  </table>`
}

// Snippet <code> inline (interpolé dans les phrases traduites en param {code}).
function inlineCode(text: string): string {
  return `<code style="background:${C.gray100};padding:2px 6px;border-radius:3px;">${text}</code>`
}

// --- Templates ---

export function welcomeTemplate(locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const tw = (key: string) => t(locale, `emails.welcome.${key}`)
  return {
    subject: tw('subject'),
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${C.gray900};line-height:1.3;">${tw('title')}</h2>
      <p style="margin:0 0 20px;color:${C.gray700};">${tw('intro')}</p>

      <p style="margin:0 0 8px;color:${C.gray900};">${tw('stepsLead')}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${C.gray100};">
          <span style="font-size:13px;color:${C.gray500};font-weight:600;">${tw('step1Label')}</span><br>
          <span style="font-size:14px;color:${C.gray900};font-weight:500;">${tw('step1Title')}</span><br>
          <span style="font-size:13px;color:${C.gray700};">${tw('step1Desc')}</span>
        </td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${C.gray100};">
          <span style="font-size:13px;color:${C.gray500};font-weight:600;">${tw('step2Label')}</span><br>
          <span style="font-size:14px;color:${C.gray900};font-weight:500;">${tw('step2Title')}</span><br>
          <span style="font-size:13px;color:${C.gray700};">${tw('step2Desc')}</span>
        </td></tr>
        <tr><td style="padding:12px 16px;">
          <span style="font-size:13px;color:${C.gray500};font-weight:600;">${tw('step3Label')}</span><br>
          <span style="font-size:14px;color:${C.gray900};font-weight:500;">${tw('step3Title')}</span><br>
          <span style="font-size:13px;color:${C.gray700};">${tw('step3Desc')}</span>
        </td></tr>
      </table>

      ${button(`${APP_URL}/dashboard/sites`, tw('cta'))}

      <p style="margin:0;color:${C.gray500};font-size:13px;">${tw('footer')}</p>
    `, locale),
  }
}

export interface CrawlReportData {
  siteName: string
  siteId: string
  zoneName?: string | null
  zoneId?: string | null
  regressions: { pageUrl: string; severity: string; message: string }[]
  fixed: { pageUrl: string; message: string }[]
  topRecos: TopReco[]
  recoCount: number
}

// Une ligne d'alerte (pastille colorée + message + URL).
function reportRow(message: string, pageUrl: string, dotColor: string): string {
  return `<tr><td style="padding:10px 14px;border-bottom:1px solid ${C.gray100};font-size:13px;">
    <div style="display:flex;align-items:flex-start;">
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background-color:${dotColor};margin-right:8px;flex-shrink:0;margin-top:4px;"></span>
      <div><span style="color:${C.gray900};font-weight:500;">${message}</span><br>
      <span style="color:${C.gray500};font-size:12px;">${pageUrl}</span></div>
    </div></td></tr>`
}

/**
 * Rapport de fin de crawl, monitoring-first : régressions détectées (🔴) + régressions réparées
 * (🟢) dans le même mail. Les recommandations d'audit ne déclenchent jamais ce mail et tiennent
 * en une ligne discrète. Le mail n'est construit que si regressions>0 OU fixed>0.
 */
export function crawlReportTemplate(data: CrawlReportData, locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const tc = (key: string, params?: Record<string, string | number>) => t(locale, `emails.crawlReport.${key}`, params)
  const label = data.zoneName ? `${data.siteName} › ${data.zoneName}` : data.siteName
  const alertsUrl = data.zoneId
    ? `${APP_URL}/dashboard/sites/${data.siteId}/zones/${data.zoneId}/alerts`
    : `${APP_URL}/dashboard/sites/${data.siteId}`
  const reportUrl = data.zoneId
    ? `${APP_URL}${zoneReportPath(data.siteId, data.zoneId)}`
    : null

  const regCount = data.regressions.length
  const fixCount = data.fixed.length

  // Le mail n'est envoyé que si regCount>0 OU fixCount>0 (cf. buildCrawlReport.shouldSend).
  const subject = regCount > 0
    ? `${tc(`subjectDetected.${nKey(regCount)}`, { count: regCount })}${fixCount > 0 ? tc(`subjectFixedSuffix.${nKey(fixCount)}`, { count: fixCount }) : ''} — ${label}`
    : `${tc(`subjectFixed.${nKey(fixCount)}`, { count: fixCount })} — ${label}`

  // Régressions : critiques d'abord, 8 listées max.
  const sortedReg = [...data.regressions].sort((a, b) =>
    (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1))
  const regRows = sortedReg.slice(0, 8)
    .map(r => reportRow(r.message, r.pageUrl, r.severity === 'critical' ? C.danger : C.warning))
    .join('')
  const regMore = regCount > 8
    ? `<tr><td style="padding:10px 14px;font-size:13px;color:${C.gray500};text-align:center;">${tc('detectedMore', { count: regCount - 8 })}</td></tr>`
    : ''
  const regBlock = regCount > 0
    ? `<p style="margin:0 0 12px;font-size:15px;color:${C.gray900};">${tc(`detectedHeading.${nKey(regCount)}`, { count: regCount })}</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;margin:0 0 24px;">${regRows}${regMore}</table>`
    : ''

  // Réparées (vert) : 8 listées max.
  const fixRows = data.fixed.slice(0, 8).map(f => reportRow(f.message, f.pageUrl, C.success)).join('')
  const fixMore = fixCount > 8
    ? `<tr><td style="padding:10px 14px;font-size:13px;color:${C.gray500};text-align:center;">${tc('fixedMore', { count: fixCount - 8 })}</td></tr>`
    : ''
  const fixBlock = fixCount > 0
    ? `<p style="margin:0 0 12px;font-size:15px;color:${C.gray900};">${tc(`fixedHeading.${nKey(fixCount)}`, { count: fixCount, goodJob: regCount === 0 ? tc('goodJob') : '' })}</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.successBorder};border-radius:8px;overflow:hidden;margin:0 0 24px;background-color:${C.successBg};">${fixRows}${fixMore}</table>`
    : ''

  // Ligne recommandations (discrète, jamais déclencheur) : top reco(s) + reste en compteur.
  const shownPages = data.topRecos.reduce((sum, r) => sum + r.pagesAffected, 0)
  const others = data.recoCount - shownPages
  const recoItems = data.topRecos.map((r) => {
    // Label + hint résolus À LA LOCALE du destinataire (les valeurs figées dans TopReco sont
    // la vue FR de rankRecommendations — jamais affichées telles quelles).
    const label = getAlertTypeLabels(locale)[r.ruleId] ?? r.label
    const hintKey = `emails.recoHints.${r.ruleId}`
    const resolvedHint = t(locale, hintKey)
    const hint = resolvedHint !== hintKey ? ` — ${resolvedHint}` : (r.hint ? ` — ${r.hint}` : '')
    const pages = r.siteLevel ? '' : tc(`recoPages.${nKey(r.pagesAffected)}`, { count: r.pagesAffected })
    return `${label}${hint}${pages}`
  }).join(' · ')
  const recoRest = others > 0 ? tc(`recoRest.${nKey(others)}`, { count: others }) : ''
  const recoLine = data.recoCount > 0
    ? `<p style="margin:8px 0 0;font-size:13px;color:${C.gray500};line-height:1.6;">💡 <strong style="color:${C.gray700};">${tc(`recoLabel.${nKey(data.topRecos.length)}`)}</strong> ${recoItems}${recoRest} — <a href="${alertsUrl}" style="color:${C.gray700};">${tc('recoDashboardLink')}</a></p>`
    : ''

  return {
    subject,
    html: layout(`
      <h2 style="margin:0 0 20px;font-size:19px;font-weight:700;color:${C.gray900};">${label}</h2>
      ${regBlock}
      ${fixBlock}
      ${button(alertsUrl, regCount > 0 ? tc('ctaResolve') : tc('ctaDashboard'))}
      ${reportUrl ? `<p style="margin:0 0 4px;font-size:13px;color:${C.gray500};">${tc('attachmentNote')}</p>${ghostButton(reportUrl, tc('ctaFullReport'))}` : ''}
      ${recoLine}
    `, locale),
  }
}

export interface DailyDigestData {
  siteName: string
  siteId: string
  totalPages: number
  regressionCount: number
  regressions: { type: string; message: string; pageUrl: string }[]
}

export function dailyDigestTemplate(data: DailyDigestData, locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const td = (key: string, params?: Record<string, string | number>) => t(locale, `emails.dailyDigest.${key}`, params)
  const isAllGood = data.regressionCount === 0

  const body = isAllGood
    ? `${infoBox(`<strong style="color:${C.success};">${td('okTitle')}</strong><br><span style="color:${C.gray700};">${td('okBody', { pages: data.totalPages.toLocaleString(INTL_LOCALE[locale]), siteName: data.siteName })}</span>`, C.success, C.successBg, C.successBorder)}
       <p style="margin:0;font-size:14px;color:${C.gray700};">${td('okFooter')}</p>`
    : `<p style="margin:0 0 16px;font-size:15px;">${td('regressionsIntro', { count: data.regressionCount, siteName: data.siteName })}</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;margin:0 0 24px;">
         ${data.regressions.slice(0, 10).map(r =>
           `<tr><td style="padding:10px 14px;border-bottom:1px solid ${C.gray100};font-size:13px;">
             <span style="color:${C.gray900};font-weight:500;">${r.message}</span><br>
             <span style="color:${C.gray500};font-size:12px;">${r.pageUrl}</span>
           </td></tr>`,
         ).join('')}
       </table>`

  return {
    subject: isAllGood
      ? td('subjectOk', { siteName: data.siteName })
      : td('subjectRegressions', { count: data.regressionCount, siteName: data.siteName }),
    html: layout(`
      <h2 style="margin:0 0 20px;font-size:19px;font-weight:700;color:${C.gray900};">${td('title')}</h2>
      ${body}
      ${button(`${APP_URL}/dashboard/sites/${data.siteId}`, td('cta'))}
    `, locale),
  }
}

export interface LogDigestData {
  groups: { level: string; module: string; errorCode: string; message: string; count: number; samples: string[] }[]
  totalWarn: number
  totalError: number
  totalFatal: number
}

export function logDigestTemplate(data: LogDigestData, locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const tl = (key: string, params?: Record<string, string | number>) => t(locale, `emails.logDigest.${key}`, params)
  const total = data.totalWarn + data.totalError + data.totalFatal
  const levelColor: Record<string, string> = { fatal: '#7f1d1d', error: C.danger, warn: C.warning }
  const levelBg: Record<string, string> = { fatal: '#fecaca', error: '#fee2e2', warn: '#fef3c7' }

  const rows = data.groups.map(g => {
    const bg = levelBg[g.level] || C.gray100
    const color = levelColor[g.level] || C.gray700
    const samples = g.samples.length > 0
      ? `<br><span style="color:${C.gray500};font-size:11px;">${g.samples.slice(0, 2).join(' · ')}</span>`
      : ''
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid ${C.gray200};font-size:13px;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;color:${color};background-color:${bg};margin-right:6px;">${g.level.toUpperCase()}</span>
        <strong>${g.module}</strong>${g.errorCode ? ` · <code style="font-size:11px;background:${C.gray100};padding:1px 5px;border-radius:3px;">${g.errorCode}</code>` : ''}
        <span style="color:${C.gray500};float:right;font-size:12px;">×${g.count}</span>
        <br><span style="color:${C.gray700};font-size:12px;">${g.message}</span>
        ${samples}
      </td>
    </tr>`
  }).join('')

  const summary = [
    data.totalFatal > 0 ? `<span style="color:${levelColor.fatal};font-weight:700;">${data.totalFatal} fatal</span>` : '',
    data.totalError > 0 ? `<span style="color:${levelColor.error};font-weight:700;">${data.totalError} error</span>` : '',
    data.totalWarn > 0 ? `<span style="color:${levelColor.warn};font-weight:700;">${data.totalWarn} warn</span>` : '',
  ].filter(Boolean).join(' &middot; ')

  return {
    subject: tl('subject', { count: total, date: new Date().toLocaleDateString(INTL_LOCALE[locale]) }),
    html: layout(`
      <h2 style="margin:0 0 6px;font-size:19px;font-weight:700;color:${C.gray900};">${tl('title')}</h2>
      <p style="margin:0 0 20px;font-size:14px;color:${C.gray500};">${summary} — <strong style="color:${C.gray900};">${tl('summaryTotal', { count: total })}</strong> ${tl('summaryGroups', { count: data.groups.length })}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;">
        ${rows}
      </table>
      <p style="margin:16px 0 0;color:${C.gray500};font-size:12px;">${tl('footer')}</p>
    `, locale),
  }
}

export interface CrawlerBlockedData {
  siteName: string
  pagesBlocked: number
  pagesTotal: number
}

export interface SitemapBlockedData {
  siteName: string
  siteUrl: string
}

export interface SitemapInvalidHostnameData {
  siteName: string
  siteUrl: string
  foreignHostnames: string[]
  foreignUrlCount: number
}

// Bloc « Comment résoudre » (whitelist UA / IP) — partagé par sitemapBlocked et crawlerBlocked.
function whitelistHelpBlock(locale: Locale): string {
  const th = (key: string, params?: Record<string, string | number>) => t(locale, `emails.whitelistHelp.${key}`, params)
  return `<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${C.gray900};">${th('heading')}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;margin:0 0 24px;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${C.gray100};">
          <span style="font-size:12px;color:${C.gray500};font-weight:600;text-transform:uppercase;">${th('option1Label')}</span><br>
          <span style="font-size:13px;color:${C.gray700};">${th('option1Desc', { code: inlineCode('Seogard-Bot') })}</span>
        </td></tr>
        <tr><td style="padding:12px 16px;">
          <span style="font-size:12px;color:${C.gray500};font-weight:600;text-transform:uppercase;">${th('option2Label')}</span><br>
          <span style="font-size:13px;color:${C.gray700};">${th('option2Desc', { code: inlineCode('142.132.133.166') })}</span>
        </td></tr>
      </table>

      ${button(`${APP_URL}/bot`, th('cta'))}
      <p style="margin:0;color:${C.gray500};font-size:13px;">${th('footer')}</p>`
}

export function sitemapInvalidHostnameTemplate(data: SitemapInvalidHostnameData, locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const ts = (key: string, params?: Record<string, string | number>) => t(locale, `emails.sitemapInvalidHostname.${key}`, params)
  const sample = data.foreignHostnames.slice(0, 3).map(h => `<code style="background:${C.gray100};padding:2px 6px;border-radius:3px;">${h}</code>`).join(', ')
  return {
    subject: ts('subject', { siteName: data.siteName }),
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">${ts('title')}</h2>
      <p style="margin:0 0 20px;color:${C.gray700};">${ts('intro', {
        siteName: data.siteName,
        count: data.foreignUrlCount,
        siteUrl: `<code style="background:${C.gray100};padding:2px 6px;border-radius:4px;font-size:13px;">${data.siteUrl}</code>`,
      })}</p>

      <p style="margin:0 0 20px;color:${C.gray700};">${ts('foreignHosts', { hosts: sample })}</p>

      ${infoBox(ts('consequence'), C.warning, C.warningBg)}

      <p style="margin:0;color:${C.gray500};font-size:13px;">${ts('footer')}</p>
    `, locale),
  }
}

export function sitemapBlockedTemplate(data: SitemapBlockedData, locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const ts = (key: string, params?: Record<string, string | number>) => t(locale, `emails.sitemapBlocked.${key}`, params)
  return {
    subject: ts('subject', { siteName: data.siteName }),
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">${ts('title')}</h2>
      <p style="margin:0 0 20px;color:${C.gray700};">${ts('intro', {
        siteName: data.siteName,
        siteUrl: `<code style="background:${C.gray100};padding:2px 6px;border-radius:4px;font-size:13px;">${data.siteUrl}</code>`,
      })}</p>

      ${infoBox(ts('consequence'), C.warning, C.warningBg)}

      ${whitelistHelpBlock(locale)}
    `, locale),
  }
}

export function crawlerBlockedTemplate(data: CrawlerBlockedData, locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const ts = (key: string, params?: Record<string, string | number>) => t(locale, `emails.crawlerBlocked.${key}`, params)
  const percent = Math.round((data.pagesBlocked / data.pagesTotal) * 100)

  return {
    subject: ts('subject', { percent, siteName: data.siteName }),
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">${ts('title')}</h2>
      <p style="margin:0 0 20px;color:${C.gray700};">${ts('intro', {
        blocked: data.pagesBlocked.toLocaleString(INTL_LOCALE[locale]),
        total: data.pagesTotal.toLocaleString(INTL_LOCALE[locale]),
        percent,
        siteName: data.siteName,
      })}</p>

      ${infoBox(ts('consequence'), C.warning, C.warningBg)}

      ${whitelistHelpBlock(locale)}
    `, locale),
  }
}

export function resetPasswordTemplate(resetUrl: string, locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const tr = (key: string) => t(locale, `emails.resetPassword.${key}`)
  return {
    subject: tr('subject'),
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">${tr('title')}</h2>
      <p style="margin:0 0 24px;color:${C.gray700};">${tr('intro')}</p>
      ${button(resetUrl, tr('cta'))}
      <p style="margin:0;color:${C.gray500};font-size:13px;">${tr('footer')}</p>
    `, locale),
  }
}

export interface SitemapEstimateData {
  url: string
  pageCount: number
  price: string
  sitemapUrl: string | null
}

export function sitemapEstimateTemplate(data: SitemapEstimateData, locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const te = (key: string, params?: Record<string, string | number>) => t(locale, `emails.sitemapEstimate.${key}`, params)
  const zoningEstimate = Math.round(data.pageCount * 0.2)
  const zoningPrice = (zoningEstimate * getCloudPricePerPage()).toLocaleString(INTL_LOCALE[locale], { maximumFractionDigits: 0 })
  const isLargeSite = data.pageCount > 50_000

  const contactLink = `<a href="mailto:support@seogard.io" style="color:${C.accent};font-weight:500;">${te('onPremiseContactLabel')}</a>`
  const selfHostedLink = `<a href="https://github.com/seogard-software/seogard" style="color:${C.accent};font-weight:500;">${te('selfHostedLinkLabel')}</a>`

  return {
    subject: te('subject', { pageCount: data.pageCount.toLocaleString(INTL_LOCALE[locale]), url: data.url }),
    html: layout(`
      <h2 style="margin:0 0 6px;font-size:19px;font-weight:700;color:${C.gray900};">${te('title')}</h2>
      <p style="margin:0 0 24px;color:${C.gray700};">${te('intro', { url: data.url })}</p>

      <!-- Stats -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px;border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:20px;text-align:center;border-right:1px solid ${C.gray200};width:50%;">
            <span style="display:block;font-size:30px;font-weight:700;color:${C.gray900};line-height:1;">${data.pageCount.toLocaleString(INTL_LOCALE[locale])}</span>
            <span style="font-size:13px;color:${C.gray500};margin-top:4px;display:block;">${te('statPages')}</span>
          </td>
          <td style="padding:20px;text-align:center;width:50%;">
            <span style="display:block;font-size:30px;font-weight:700;color:${C.gray900};line-height:1;">${data.price}</span>
            <span style="font-size:13px;color:${C.gray500};margin-top:4px;display:block;">${te('statPrice')}</span>
          </td>
        </tr>
      </table>

      <!-- Zoning tip -->
      ${infoBox(
        `<strong style="font-size:14px;color:${C.gray900};">${te('zoningTitle')}</strong><br>
        <span style="color:${C.gray700};">${te('zoningBody')}<br>
        ${te('zoningExample', { count: zoningEstimate.toLocaleString(INTL_LOCALE[locale]), zonedPrice: zoningPrice, fullPrice: data.price })}</span>`,
        C.gray700, C.gray50, C.gray200,
      )}

      ${isLargeSite ? `<p style="margin:0 0 20px;font-size:13px;color:${C.gray700};">${te('onPremise', { contactLink })}</p>` : ''}

      ${divider()}

      <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:${C.gray900};">${te('trialTitle')}</p>
      <p style="margin:0 0 20px;font-size:14px;color:${C.gray700};">${te('trialBody')}</p>

      ${button(`${APP_URL}/register`, te('cta'))}

      <p style="margin:0;color:${C.gray500};font-size:13px;">${te('selfHosted', { link: selfHostedLink })}</p>
    `, locale),
  }
}

export function paymentFailedTemplate(orgId: string, locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const tp = (key: string, params?: Record<string, string | number>) => t(locale, `emails.paymentFailed.${key}`, params)
  const supportLink = `<a href="mailto:support@seogard.io" style="color:${C.accent};">support@seogard.io</a>`
  return {
    subject: tp('subject'),
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">${tp('title')}</h2>
      <p style="margin:0 0 20px;color:${C.gray700};">${tp('intro')}</p>

      ${infoBox(tp('impact'), C.danger, C.dangerBg)}

      ${button(`${APP_URL}/dashboard/organizations/${orgId}/billing`, tp('cta'))}

      <p style="margin:0;color:${C.gray500};font-size:13px;">${tp('footer', { supportLink })}</p>
    `, locale),
  }
}

export function inviteTemplate(orgName: string, role: string, inviteUrl: string, locale: Locale = DEFAULT_LOCALE): { subject: string; html: string } {
  const ti = (key: string, params?: Record<string, string | number>) => t(locale, `emails.invite.${key}`, params)
  // Le libellé du rôle vient des locales ; rôle inconnu → clé brute évitée, on retombe sur la valeur.
  const roleKey = `emails.invite.roles.${role}`
  const translatedRole = t(locale, roleKey)
  const roleLabel = translatedRole === roleKey ? role : translatedRole
  return {
    subject: ti('subject', { orgName }),
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">${ti('title')}</h2>
      <p style="margin:0 0 8px;color:${C.gray700};">${ti('intro', { orgName })}</p>

      ${infoBox(`
        <strong>${ti('roleLabel')}</strong> ${roleLabel}<br>
        <strong>${ti('orgLabel')}</strong> ${orgName}
      `)}

      ${button(inviteUrl, ti('cta'))}

      <p style="margin:0;color:${C.gray500};font-size:13px;">${ti('footer')}</p>
    `, locale),
  }
}
