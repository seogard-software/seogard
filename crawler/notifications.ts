import { createLogger } from './logger'
import { EmailLog } from '../server/database/models'
import { alertCriticalTemplate, crawlerBlockedTemplate, sitemapBlockedTemplate, sitemapEstimateTemplate } from '../server/utils/email-templates'
import type { SitemapEstimateData } from '../server/utils/email-templates'

const log = createLogger('notifications')

function getFromDomain(): string {
  try {
    const url = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'
    return new URL(url).hostname
  }
  catch { return 'seogard.io' }
}

interface AlertNotification {
  siteId: string
  siteName: string
  siteUrl: string
  alertCount: number
  criticalCount: number
  warningCount: number
  userId?: string
  zoneName?: string | null
  zoneId?: string | null
  alerts: {
    pageUrl: string
    type: string
    severity: string
    message: string
  }[]
}

export async function sendEmailNotification(
  to: string,
  notification: AlertNotification,
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    log.warn('RESEND_API_KEY not configured, skipping email')
    return
  }

  const fromEmail = process.env.FROM_EMAIL || `Seogard <alerts@${getFromDomain()}>`

  const { subject, html } = alertCriticalTemplate({
    siteName: notification.siteName,
    siteId: notification.siteId,
    zoneName: notification.zoneName || null,
    zoneId: notification.zoneId || null,
    criticalCount: notification.criticalCount,
    warningCount: notification.warningCount,
    alerts: notification.alerts,
  })

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromEmail, to, subject, html }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error({ siteId: notification.siteId, errorCode: 'EMAIL_SEND_FAILED', error: errorText }, 'failed to send email')
      await EmailLog.create({
        to, subject, type: 'alert_critical', status: 'failed', bodyHtml: html,
        userId: notification.userId || null, siteId: notification.siteId, error: errorText,
      }).catch(e => log.error({ errorCode: 'EMAIL_LOG_FAILED', error: (e as Error).message }, 'failed to log email'))
      return
    }

    const result = await response.json() as { id?: string }
    log.info({ siteId: notification.siteId, to, resendId: result.id }, 'email notification sent')

    await EmailLog.create({
      to, subject, type: 'alert_critical', status: 'sent', bodyHtml: html,
      userId: notification.userId || null, siteId: notification.siteId, resendId: result.id || null,
    }).catch(e => log.error({ errorCode: 'EMAIL_LOG_FAILED', error: (e as Error).message }, 'failed to log email'))
  } catch (error) {
    const errorMsg = (error as Error).message
    log.error({ siteId: notification.siteId, errorCode: 'EMAIL_SEND_ERROR', error: errorMsg }, 'email send error')
    await EmailLog.create({
      to, subject, type: 'alert_critical', status: 'failed', bodyHtml: html,
      userId: notification.userId || null, siteId: notification.siteId, error: errorMsg,
    }).catch(e => log.error({ errorCode: 'EMAIL_LOG_FAILED', error: (e as Error).message }, 'failed to log email'))
  }
}

export async function sendSitemapBlockedNotification(
  to: string,
  siteName: string,
  siteUrl: string,
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    log.warn('RESEND_API_KEY not configured, skipping sitemap blocked email')
    return
  }

  const fromEmail = process.env.FROM_EMAIL || `Seogard <alerts@${getFromDomain()}>`
  const { subject, html } = sitemapBlockedTemplate({ siteName, siteUrl })

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromEmail, to, subject, html }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error({ errorCode: 'SITEMAP_BLOCKED_EMAIL_FAILED', error: errorText }, 'failed to send sitemap blocked email')
      return
    }

    log.info({ to, siteName }, 'sitemap blocked notification sent')
  }
  catch (error) {
    log.error({ errorCode: 'SITEMAP_BLOCKED_EMAIL_ERROR', error: (error as Error).message }, 'sitemap blocked email error')
  }
}

export async function sendCrawlerBlockedNotification(
  to: string,
  siteName: string,
  pagesBlocked: number,
  pagesTotal: number,
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    log.warn('RESEND_API_KEY not configured, skipping crawler blocked email')
    return
  }

  const fromEmail = process.env.FROM_EMAIL || `Seogard <alerts@${getFromDomain()}>`
  const { subject, html } = crawlerBlockedTemplate({ siteName, pagesBlocked, pagesTotal })

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromEmail, to, subject, html }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error({ errorCode: 'CRAWLER_BLOCKED_EMAIL_FAILED', error: errorText }, 'failed to send crawler blocked email')
      return
    }

    log.info({ to, pagesBlocked, pagesTotal }, 'crawler blocked notification sent')
  }
  catch (error) {
    log.error({ errorCode: 'CRAWLER_BLOCKED_EMAIL_ERROR', error: (error as Error).message }, 'crawler blocked email error')
  }
}

export async function sendEstimateEmail(
  to: string,
  data: SitemapEstimateData,
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    log.warn('RESEND_API_KEY not configured, skipping estimate email')
    return
  }

  const { subject, html } = sitemapEstimateTemplate(data)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: `Seogard <noreply@${getFromDomain()}>`, to, subject, html }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error({ errorCode: 'ESTIMATE_EMAIL_FAILED', error: errorText }, 'failed to send estimate email')
      await EmailLog.create({
        to, subject, type: 'sitemap_estimate', status: 'failed', bodyHtml: html, error: errorText,
      }).catch(e => log.error({ errorCode: 'EMAIL_LOG_FAILED', error: (e as Error).message }, 'failed to log email'))
      return
    }

    const result = await response.json() as { id?: string }
    log.info({ to, resendId: result.id }, 'estimate email sent')

    await EmailLog.create({
      to, subject, type: 'sitemap_estimate', status: 'sent', bodyHtml: html, resendId: result.id || null,
    }).catch(e => log.error({ errorCode: 'EMAIL_LOG_FAILED', error: (e as Error).message }, 'failed to log email'))
  }
  catch (error) {
    log.error({ errorCode: 'ESTIMATE_EMAIL_ERROR', error: (error as Error).message }, 'estimate email error')
  }
}

