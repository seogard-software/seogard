import { Schema, model, Types } from 'mongoose'

// Métadonnées d'un rapport figé à la fin d'un crawl. Les FICHIERS (.md exhaustif + .pdf court)
// vivent dans le stockage objet (R2/S3) — Mongo ne garde que leurs clés + les compteurs de la
// frise. Mongo n'est donc PAS alourdi. Purge : rapports de plus de 3 mois (dans finalizeCrawl).
const crawlReportSchema = new Schema({
  crawlId: { type: Types.ObjectId, ref: 'Crawl', required: true, unique: true },
  siteId: { type: Types.ObjectId, ref: 'Site', required: true },
  zoneId: { type: Types.ObjectId, ref: 'Zone', required: true },
  completedAt: { type: Date, required: true },
  pagesScanned: { type: Number, default: 0 },
  // Activité du crawl (mêmes définitions que l'email) — sert la frise sans recalcul.
  regressions: { type: Number, default: 0 },
  fixed: { type: Number, default: 0 },
  verdict: { type: String, enum: ['critical', 'warning', 'info', 'stable'], default: 'stable' },
  // Langue du rapport figé (.md/.pdf) — celle du owner de l'org au moment de la génération.
  locale: { type: String, enum: ['fr', 'en'], default: 'fr' },
  // Clés des fichiers dans le stockage objet (R2/S3) — .md exhaustif, .pdf court.
  mdKey: { type: String, required: true },
  pdfKey: { type: String, required: true },
}, { timestamps: true })

// Liste de l'historique par zone (page) + lookup download par crawl (unique déjà indexé).
crawlReportSchema.index({ siteId: 1, zoneId: 1, completedAt: -1 })

export const CrawlReport = model('CrawlReport', crawlReportSchema)
