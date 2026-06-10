import { Schema, model, Types } from 'mongoose'
import { randomUUID } from 'node:crypto'

const siteSchema = new Schema({
  orgId: { type: Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  status: { type: String, enum: ['active', 'paused', 'error'], default: 'active' },
  notifyEmail: { type: Boolean, default: true },
  apiKey: { type: String, default: () => randomUUID() },
  lastCrawlAt: Date,
  // Bumped quand les pages changent SANS crawl (discovery sitemap). Avec lastCrawlAt,
  // sert de version pour invalider le cache tree cross-process (web ↔ crawler).
  pagesUpdatedAt: Date,
  discovering: { type: String, enum: ['idle', 'pending', 'running'], default: 'idle' },
  discoveryStartedAt: { type: Date, default: null },
  sitemapBlocked: { type: Boolean, default: false },
  sitemapInvalidHostname: { type: Boolean, default: false },
  // Contexte site-level (GEO) du dernier crawl, comparé au crawl suivant pour détecter les
  // régressions site-level (llms.txt supprimé, crawler IA / Googlebot nouvellement bloqué).
  // DOIT être déclaré : sinon Mongoose (strict) le strippe à l'écriture → la détection ne marche pas.
  siteContext: {
    hasLlmsTxt: Boolean,
    aiCrawlersBlocked: [String],
    googlebotBlockedPaths: [String],
  },
}, { timestamps: true })

siteSchema.index({ orgId: 1, url: 1 }, { unique: true })

export const Site = model('Site', siteSchema)
