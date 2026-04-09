import { Schema, model } from 'mongoose'

const leadSchema = new Schema({
  url: { type: String, required: true },
  email: { type: String, default: null },
  pageCount: { type: Number, default: null },
  estimatedPrice: { type: Number, default: null },
  sitemapUrl: { type: String, default: null },
  ip: { type: String, default: null },
  userAgent: { type: String, default: null },
  referer: { type: String, default: null },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'completed' },
}, { timestamps: true })

leadSchema.index({ url: 1 })
leadSchema.index({ createdAt: -1 })

// findOneAndUpdate({ status: 'pending' }) — crawler pick lead
leadSchema.index({ status: 1 })

export const Lead = model('Lead', leadSchema)
