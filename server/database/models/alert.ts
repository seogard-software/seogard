import { Schema, model, Types } from 'mongoose'

const ALERT_TYPES = [
  // Meta (meta.ts)
  'meta_title_changed',
  'meta_title_missing',
  'meta_description_changed',
  'meta_description_missing',
  'canonical_changed',
  'canonical_missing',
  // Indexing (indexing.ts)
  'noindex_added',
  'robots_txt_changed',
  // Status code (status-code.ts)
  'status_code_changed',
  // SSR/CSR (ssr-csr.ts)
  'ssr_rendering_failed',
  'ssr_content_mismatch',
  'ssr_title_mismatch',
  'ssr_meta_description_mismatch',
  'ssr_blocked',
  // Heading (heading.ts)
  'h1_missing',
  'h1_multiple',
  'h1_changed',
  'heading_hierarchy_broken',
  'title_duplicate_of_h1',
  // Content (content.ts)
  'soft_404',
  'thin_content',
  'content_removed',
  'word_count_changed',
  // Structured data (structured-data.ts)
  'structured_data_removed',
  'structured_data_error',
  // Technical (technical.ts)
  'viewport_missing',
  'charset_missing',
  'meta_refresh_detected',
  'https_mixed_content',
  // Open Graph (opengraph.ts)
  'og_image_removed',
  'og_title_removed',
  // i18n (i18n.ts)
  'hreflang_removed',
  'hreflang_changed',
  'lang_attribute_missing',
  'lang_attribute_changed',
  // Redirect (redirect.ts)
  'redirect_to_homepage',
  // Recommendations (recommendations.ts)
  'rec_img_alt_audit',
  'rec_title_length_audit',
  'rec_description_length_audit',
  'rec_h1_missing_audit',
  'rec_favicon_missing_audit',
  'rec_semantic_structure_audit',
  'rec_structured_data_missing_audit',
  'rec_og_missing_audit',
  'rec_internal_links_audit',
  // Legacy (kept for existing alerts)
  'backlink_lost',
  'redirect_added',
  'redirect_removed',
] as const

const alertSchema = new Schema({
  siteId: { type: Types.ObjectId, ref: 'Site', required: true },
  pageUrl: { type: String, required: true },
  ruleId: { type: String, enum: ALERT_TYPES, required: true },
  category: { type: String, enum: ['state', 'event', 'recommendation'], required: true },
  severity: { type: String, enum: ['critical', 'warning', 'info'], required: true },
  message: { type: String, required: true },
  previousValue: String,
  currentValue: String,
  status: { type: String, enum: ['open', 'resolved'], default: 'open', required: true },
  firstCrawlId: { type: Types.ObjectId, ref: 'Crawl', required: true },
  lastCrawlId: { type: Types.ObjectId, ref: 'Crawl', required: true },
  firstDetectedAt: { type: Date, required: true },
  lastDetectedAt: { type: Date, required: true },
  occurrences: { type: Number, default: 1 },
  resolvedAt: Date,
  resolvedBy: { type: String, enum: ['auto', 'user'] },
}, { timestamps: true })

// Un seul alert actif par (site, page, règle)
alertSchema.index(
  { siteId: 1, pageUrl: 1, ruleId: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } },
)
alertSchema.index({ siteId: 1, status: 1 })
alertSchema.index({ siteId: 1, status: 1, category: 1, pageUrl: 1 })

// Notifications post-crawl + polling status crawl
alertSchema.index({ siteId: 1, lastCrawlId: 1 })

// Dashboard alertes : countDocuments par severity
alertSchema.index({ siteId: 1, status: 1, severity: 1 })

export const Alert = model('Alert', alertSchema)
