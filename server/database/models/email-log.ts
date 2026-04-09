import { Schema, model, Types } from 'mongoose'

const EMAIL_TYPES = [
  'welcome',
  'alert_critical',
  'daily_digest',
  'reset_password',

  'payment_failed',
  'org_invite',
] as const

const emailLogSchema = new Schema({
  to: { type: String, required: true, index: true },
  subject: { type: String, required: true },
  type: { type: String, enum: EMAIL_TYPES, required: true, index: true },
  status: { type: String, enum: ['sent', 'failed'], required: true },
  bodyHtml: { type: String, required: true },
  userId: { type: Types.ObjectId, ref: 'User', default: null, index: true },
  siteId: { type: Types.ObjectId, ref: 'Site', default: null, index: true },
  resendId: { type: String, default: null },
  error: { type: String, default: null },
}, { timestamps: true })

export const EmailLog = model('EmailLog', emailLogSchema)
