import { Schema, model, Types } from 'mongoose'

const crawlScheduleSchema = new Schema({
  siteId: { type: Types.ObjectId, ref: 'Site', required: true, index: true },
  zoneId: { type: Types.ObjectId, ref: 'Zone', required: true },
  enabled: { type: Boolean, default: false },
  frequency: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'], required: true },
  dayOfWeek: { type: Number, min: 0, max: 6, default: null },
  dayOfMonth: { type: Number, min: 1, max: 31, default: null },
  lastDayOfMonth: { type: Boolean, default: false },
  hour: { type: Number, min: 0, max: 23, required: true },
  lastCrawledAt: { type: Date, default: null },
  nextCrawlAt: { type: Date, default: null },
}, { timestamps: true })

// One schedule per zone in V1 (the UI exposes a single entry). The unique index
// prevents accidental duplicates even if a future code path tries to insert one.
crawlScheduleSchema.index({ zoneId: 1 }, { unique: true })

// Scheduler hot path: find due schedules in one indexed query.
crawlScheduleSchema.index({ enabled: 1, nextCrawlAt: 1 })

export const CrawlSchedule = model('CrawlSchedule', crawlScheduleSchema)
