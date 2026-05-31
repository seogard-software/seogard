import { Schema } from 'mongoose'

// Sous-schema partagé entre PageSnapshot.perf (série temporelle) et
// MonitoredPage.lastPerf (baseline pour les règles de régression).
// Uniquement des scalaires → ~130 octets, aucun risque de bloat.
export const perfSchema = new Schema({
  ttfbMs: { type: Number, default: null },
  lcpMs: { type: Number, default: null },
  cls: { type: Number, default: null },
  weightTotalKb: { type: Number, default: null },
  weightHtmlKb: { type: Number, default: null },
  weightCssKb: { type: Number, default: null },
  weightJsKb: { type: Number, default: null },
  weightImgKb: { type: Number, default: null },
  weightFontKb: { type: Number, default: null },
  weightOtherKb: { type: Number, default: null },
  requestCount: { type: Number, default: null },
}, { _id: false })
