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
  // Aucun sitemap exploitable trouvé au dernier crawl (≠ bloqué WAF) → on ne surveille que la
  // page d'accueil. Sert à afficher un bandeau d'avertissement honnête sur la page des pages.
  sitemapMissing: { type: Boolean, default: false },
  // Nb de pages dont le fetch a échoué au dernier crawl (site injoignable / « fetch failed »).
  // > 0 → bandeau « pages non analysées », pour ne pas afficher « tout va bien » à tort.
  lastCrawlPagesFailed: { type: Number, default: 0 },
  // Pages MONITORÉES qui ont quitté le sitemap au dernier crawl (signal de PÉRIMÈTRE, pas une
  // alerte). Bandeau consolidé « N pages ont quitté le sitemap » + bouton « C'est normal ».
  // `nonOkCount` = combien ne répondent plus en 200 (warning si >0, sinon info).
  sitemapRemoved: {
    count: { type: Number, default: 0 },
    nonOkCount: { type: Number, default: 0 },
    crawlId: { type: Schema.Types.ObjectId, ref: 'Crawl', default: null },
    sampleUrls: { type: [String], default: [] },
  },
  // Acquittement utilisateur (« C'est normal, masquer ») : le bandeau ne réapparaît que si le
  // count repart au-dessus de la valeur acquittée.
  sitemapRemovedAck: {
    count: { type: Number, default: 0 },
    crawlId: { type: Schema.Types.ObjectId, ref: 'Crawl', default: null },
  },
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
