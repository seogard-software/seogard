import { Schema, model, Types } from 'mongoose'

const pageSnapshotSchema = new Schema({
  pageId: { type: Types.ObjectId, ref: 'MonitoredPage', required: true, index: true },
  crawlId: { type: Types.ObjectId, ref: 'Crawl', required: true },
  statusCode: { type: Number, required: true },
  meta: { type: Schema.Types.Mixed },
  csrRendered: { type: Boolean, default: false },
  ssrContentLength: { type: Number, required: true },
  csrContentLength: Number,
}, { timestamps: true })

// Auto-delete snapshots older than 12 months
pageSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 })

// Queries par crawlId : countDocuments, find (finalize crawl)
pageSnapshotSchema.index({ crawlId: 1 })

// findOneAndUpdate({ pageId, crawlId }) — appele 1 fois par page pendant le crawl
pageSnapshotSchema.index({ pageId: 1, crawlId: 1 })

export const PageSnapshot = model('PageSnapshot', pageSnapshotSchema)
