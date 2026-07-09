import frRules from '../../i18n/locales/fr/rules.json' with { type: 'json' }
import enRules from '../../i18n/locales/en/rules.json' with { type: 'json' }


// Labels des règles : SOURCE = i18n/locales/<locale>/rules.json (extraction i18n 2026-07).
// ALERT_TYPE_LABELS reste l'export historique (vue FR) — les consommateurs localisés passent
// par getAlertTypeLabels(locale).
export const ALERT_TYPE_LABELS: Record<string, string> = frRules.labels

export function getAlertTypeLabels(locale: 'fr' | 'en'): Record<string, string> {
  return locale === 'en' ? { ...frRules.labels, ...(enRules as { labels?: Record<string, string> }).labels } : frRules.labels
}

export const STATE_RULES: Set<string> = new Set([
  'soft_404', 'meta_refresh_detected', 'https_mixed_content',
  'structured_data_error', 'redirect_to_homepage',
  // js_redirect_detected = state (détecté au rendu CSR à chaque crawl, auto-résolu quand le JS est retiré)
  'js_redirect_detected',
  'ssr_content_mismatch', 'ssr_rendering_failed',
  'ssr_title_mismatch', 'ssr_meta_description_mismatch', 'ssr_blocked',
])

export const RECOMMENDATION_RULES: Set<string> = new Set([
  'rec_img_alt_audit', 'rec_img_alt_missing_in_ssr',
  'rec_title_length_audit', 'rec_description_length_audit',
  'rec_h1_missing_audit', 'rec_h1_missing_in_ssr', 'rec_content_missing_in_ssr',
  'rec_title_missing_in_ssr', 'rec_description_missing_in_ssr',
  'rec_favicon_missing_audit',
  'rec_semantic_structure_audit', 'rec_semantic_structure_missing_in_ssr',
  'rec_structured_data_missing_audit', 'rec_structured_data_missing_in_ssr',
  'rec_og_missing_audit',
  'rec_internal_links_audit', 'rec_internal_links_missing_in_ssr',
  // GEO
  'rec_llms_txt_missing', 'rec_ai_crawlers_blocked',
  'rec_structured_data_incomplete', 'rec_faq_schema_missing',
  'rec_citation_signals_missing', 'rec_content_structure_audit',
  // Performance — audit poids uniquement (LCP/CLS/TTFB = monitoring, sans alerte)
  'rec_perf_page_heavy',
  // Cycle de vie des pages retirées (hors sitemap) — conseils, re-fire tant que vrai
  'rec_redirect_temporary', 'rec_unclean_removal',
  // Conflits sitemap (le sitemap déclare, la page contredit) — état installé, fire dès le 1er crawl
  'rec_sitemap_noindex_conflict',
])

export function getRuleCategory(ruleId: string): AlertCategory {
  if (STATE_RULES.has(ruleId)) return 'state'
  if (RECOMMENDATION_RULES.has(ruleId)) return 'recommendation'
  return 'event'
}

