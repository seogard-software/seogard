import { Schema, model, Types } from 'mongoose'

const zoneRoleSchema = new Schema({
  zoneId: { type: Types.ObjectId, ref: 'Zone', required: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], required: true },
}, { _id: false })

const orgMemberSchema = new Schema({
  orgId: { type: Types.ObjectId, ref: 'Organization', required: true, index: true },
  userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['owner', 'member'], required: true },
  zoneRoles: { type: [zoneRoleSchema], default: [] },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true })

orgMemberSchema.index({ orgId: 1, userId: 1 }, { unique: true })

export const OrgMember = model('OrgMember', orgMemberSchema)
