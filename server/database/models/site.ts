import { Schema, model, Types } from 'mongoose'
import { randomUUID } from 'node:crypto'

const siteSchema = new Schema({
  orgId: { type: Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  status: { type: String, enum: ['active', 'paused', 'error'], default: 'active' },
  notifyEmail: { type: Boolean, default: true },
  apiKey: { type: String, default: () => randomUUID() },
  ciStrictness: { type: String, enum: ['strict', 'standard', 'relaxed'], default: 'standard' },
  lastCrawlAt: Date,
  discovering: { type: String, enum: ['idle', 'pending', 'running'], default: 'idle' },
  discoveryStartedAt: { type: Date, default: null },
  sitemapBlocked: { type: Boolean, default: false },
}, { timestamps: true })

siteSchema.index({ orgId: 1, url: 1 }, { unique: true })

// findOne({ apiKey }) — webhook deploy lookup
siteSchema.index({ apiKey: 1 }, { sparse: true })

export const Site = model('Site', siteSchema)
