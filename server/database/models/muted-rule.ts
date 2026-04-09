import { Schema, model, Types } from 'mongoose'

const mutedRuleSchema = new Schema({
  siteId: { type: Types.ObjectId, ref: 'Site', required: true },
  ruleId: { type: String, required: true },
  mutedBy: { type: Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

mutedRuleSchema.index({ siteId: 1, ruleId: 1 }, { unique: true })

export const MutedRule = model('MutedRule', mutedRuleSchema)
