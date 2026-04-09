import { Schema, model, Types } from 'mongoose'
import { randomUUID } from 'node:crypto'

const orgInviteSchema = new Schema({
  orgId: { type: Types.ObjectId, ref: 'Organization', required: true, index: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], required: true },
  zoneId: { type: Types.ObjectId, ref: 'Zone', default: null },
  zoneRole: { type: String, enum: ['admin', 'member', 'viewer'], default: null },
  invitedBy: { type: Types.ObjectId, ref: 'User', required: true },
  token: { type: String, unique: true, default: () => randomUUID() },
  status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
}, { timestamps: true })

orgInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
orgInviteSchema.index({ orgId: 1, email: 1 })

export const OrgInvite = model('OrgInvite', orgInviteSchema)
