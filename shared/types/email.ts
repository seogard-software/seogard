export type EmailType =
  | 'welcome'
  | 'alert_critical'
  | 'daily_digest'
  | 'reset_password'

  | 'payment_failed'
  | 'org_invite'

export type EmailStatus = 'sent' | 'failed'

export interface EmailLog {
  _id: string
  to: string
  subject: string
  type: EmailType
  status: EmailStatus
  bodyHtml: string
  userId: string | null
  siteId: string | null
  resendId: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}
