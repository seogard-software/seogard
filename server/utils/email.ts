import { EmailLog } from '../database/models'
import {
  welcomeTemplate,
  dailyDigestTemplate,
  resetPasswordTemplate,
  paymentFailedTemplate,
  inviteTemplate,
} from './email-templates'
import type { DailyDigestData } from './email-templates'
import { toLocale } from '../../shared/utils/i18n'

const log = createLogger('web', 'email')

function getFromDomain(): string {
  try {
    const url = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'
    return new URL(url).hostname
  }
  catch { return 'seogard.io' }
}

function buildFrom(): { noreply: string; support: string; alerts: string; billing: string } {
  const fromEmail = process.env.FROM_EMAIL
  if (fromEmail) {
    // Single FROM_EMAIL override — use it for everything
    const display = fromEmail.includes('<') ? fromEmail : `Seogard <${fromEmail}>`
    return { noreply: display, support: display, alerts: display, billing: display }
  }
  const domain = getFromDomain()
  return {
    noreply: `Seogard <noreply@${domain}>`,
    support: `Seogard <support@${domain}>`,
    alerts: `Seogard Alertes <alerts@${domain}>`,
    billing: `Seogard <billing@${domain}>`,
  }
}

const FROM = buildFrom()

type EmailType = 'welcome' | 'alert_critical' | 'daily_digest' | 'reset_password' | 'payment_failed' | 'org_invite' | 'sitemap_estimate' | 'admin_signup'

const FROM_BY_TYPE: Record<EmailType, string> = {
  welcome: FROM.support,
  reset_password: FROM.noreply,
  alert_critical: FROM.alerts,
  daily_digest: FROM.alerts,
  payment_failed: FROM.billing,
  org_invite: FROM.noreply,
  sitemap_estimate: FROM.support,
  admin_signup: FROM.noreply,
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  type: EmailType
  userId?: string
  siteId?: string
}

async function sendEmail(params: SendEmailParams): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    log.warn({ type: params.type, to: params.to }, 'RESEND_API_KEY not configured, skipping email')
    return
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_BY_TYPE[params.type],
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error({ type: params.type, to: params.to, errorCode: 'EMAIL_SEND_FAILED', error: errorText }, 'failed to send email via Resend')
      await EmailLog.create({
        to: params.to,
        subject: params.subject,
        type: params.type,
        status: 'failed',
        bodyHtml: params.html,
        userId: params.userId || null,
        siteId: params.siteId || null,
        error: errorText,
      })
      return
    }

    const result = await response.json() as { id?: string }
    log.info({ type: params.type, to: params.to, resendId: result.id }, 'email sent')

    await EmailLog.create({
      to: params.to,
      subject: params.subject,
      type: params.type,
      status: 'sent',
      bodyHtml: params.html,
      userId: params.userId || null,
      siteId: params.siteId || null,
      resendId: result.id || null,
    })
  } catch (err) {
    const errorMsg = (err as Error).message
    log.error({ type: params.type, to: params.to, errorCode: 'EMAIL_SEND_ERROR', error: errorMsg }, 'email send error')
    await EmailLog.create({
      to: params.to,
      subject: params.subject,
      type: params.type,
      status: 'failed',
      bodyHtml: params.html,
      userId: params.userId || null,
      siteId: params.siteId || null,
      error: errorMsg,
    }).catch(dbErr => log.error({ errorCode: 'EMAIL_LOG_FAILED', error: (dbErr as Error).message }, 'failed to log email'))
  }
}

// --- Convenience functions ---
// `locale` = langue du destinataire (User.locale), coercée en Locale (fallback FR pour un
// compte antérieur au champ). Les templates rendent sujet + corps dans cette langue.

export async function sendWelcomeEmail(to: string, userId: string, locale?: string): Promise<void> {
  const { subject, html } = welcomeTemplate(toLocale(locale))
  await sendEmail({ to, subject, html, type: 'welcome', userId })
}

// TEMPORAIRE — notif perso à chaque nouvel inscrit (destinataire + contenu en dur, à supprimer).
export async function sendNewSignupAdminEmail(userEmail: string): Promise<void> {
  await sendEmail({
    to: 'support@seogard.io',
    subject: `Nouvel inscrit : ${userEmail}`,
    html: `<p>${userEmail}</p>`,
    type: 'admin_signup',
  })
}

export async function sendDailyDigestEmail(to: string, userId: string, siteId: string, data: DailyDigestData, locale?: string): Promise<void> {
  const { subject, html } = dailyDigestTemplate(data, toLocale(locale))
  await sendEmail({ to, subject, html, type: 'daily_digest', userId, siteId })
}

export async function sendResetPasswordEmail(to: string, resetUrl: string, locale?: string): Promise<void> {
  const { subject, html } = resetPasswordTemplate(resetUrl, toLocale(locale))
  await sendEmail({ to, subject, html, type: 'reset_password' })
}

export async function sendPaymentFailedEmail(to: string, userId: string, orgId: string, locale?: string): Promise<void> {
  const { subject, html } = paymentFailedTemplate(orgId, toLocale(locale))
  await sendEmail({ to, subject, html, type: 'payment_failed', userId })
}

export async function sendInviteEmail(to: string, orgName: string, role: string, token: string, locale?: string): Promise<void> {
  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`
  const { subject, html } = inviteTemplate(orgName, role, inviteUrl, toLocale(locale))
  await sendEmail({ to, subject, html, type: 'org_invite' })
}
