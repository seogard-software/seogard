import { Schema, model, Types } from 'mongoose'

const crawlSchema = new Schema({
  siteId: { type: Types.ObjectId, ref: 'Site', required: true, index: true },
  // Un crawl appartient TOUJOURS à une zone (zone par défaut = site entier). Les anciens
  // crawls historiques peuvent avoir null ; toute création passe par triggerSiteCrawl.
  zoneId: { type: Types.ObjectId, ref: 'Zone', required: true },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'cancelled'], default: 'pending' },
  trigger: { type: String, enum: ['manual', 'webhook', 'scheduled'], default: 'manual' },
  pagesScanned: { type: Number, default: 0 },
  pagesFailed: { type: Number, default: 0 },
  pagesBlocked: { type: Number, default: 0 },
  pagesTotal: { type: Number, default: 0 },
  alertsGenerated: { type: Number, default: 0 },
  pagesSkipped: { type: Number, default: 0 },
  // Pages sorties du monitoring par la purge de fin de crawl (410 + hors sitemap au-delà de la
  // fenêtre PURGE_GONE_AFTER_DAYS). Alimente la ligne du rapport figé — jamais un mail.
  pagesPurged: { type: Number, default: 0 },
  sitemapBlocked: { type: Boolean, default: false },
  startedAt: Date,
  completedAt: Date,
  error: String,
}, { timestamps: true })

// findOne({ siteId, status }).sort({ createdAt: -1 }) — dashboard + polling + pickCrawl
crawlSchema.index({ siteId: 1, status: 1, createdAt: -1 })

export const Crawl = model('Crawl', crawlSchema)
