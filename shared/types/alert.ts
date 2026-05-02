export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertStatus = 'open' | 'resolved'
export type AlertCategory = 'state' | 'event' | 'recommendation'

export type AlertType =
  // P0 — Deindexation
  | 'noindex_added'
  | 'status_code_changed'
  | 'canonical_missing'
  | 'canonical_changed'
  | 'meta_title_missing'
  | 'soft_404'
  | 'redirect_to_homepage'
  // P1 — Direct ranking
  | 'ssr_rendering_failed'
  | 'ssr_content_mismatch'
  | 'h1_missing'
  | 'h1_multiple'
  | 'h1_changed'
  | 'viewport_missing'
  | 'thin_content'
  | 'content_removed'
  | 'hreflang_removed'
  | 'hreflang_changed'
  | 'title_duplicate_of_h1'
  | 'https_mixed_content'
  // P2 — CTR / SERP
  | 'meta_description_missing'
  | 'structured_data_removed'
  | 'structured_data_error'
  | 'og_image_removed'
  | 'og_title_removed'
  | 'meta_refresh_detected'
  | 'robots_txt_changed'
  // P3 — Quality
  | 'heading_hierarchy_broken'
  | 'lang_attribute_missing'
  | 'lang_attribute_changed'
  | 'word_count_changed'
  | 'charset_missing'
  | 'ssr_title_mismatch'
  | 'ssr_meta_description_mismatch'
  | 'meta_title_changed'
  | 'meta_description_changed'
  // Recommendations (audit)
  | 'rec_img_alt_audit'
  | 'rec_title_length_audit'
  | 'rec_description_length_audit'
  | 'rec_h1_missing_audit'
  | 'rec_h1_missing_in_ssr'
  | 'rec_favicon_missing_audit'
  | 'rec_semantic_structure_audit'
  | 'rec_structured_data_missing_audit'
  | 'rec_og_missing_audit'
  | 'rec_internal_links_audit'

export interface Alert {
  _id: string
  siteId: string
  pageUrl: string
  ruleId: AlertType
  category: AlertCategory
  severity: AlertSeverity
  message: string
  previousValue: string | null
  currentValue: string | null
  status: AlertStatus
  firstCrawlId: string
  lastCrawlId: string
  firstDetectedAt: string
  lastDetectedAt: string
  occurrences: number
  resolvedAt: string | null
  resolvedBy: 'auto' | 'user' | null
  createdAt: string
  updatedAt: string
}

export interface AlertGroup {
  ruleId: AlertType
  severity: AlertSeverity
  label: string
  count: number
  sampleMessage?: string
  alerts: Alert[]
}
