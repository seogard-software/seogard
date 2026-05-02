export const LOGGED_IN_COOKIE_NAME = 'seogard_logged_in'

export const ALERT_SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critique',
  warning: 'Attention',
  info: 'Info',
}

export const ALERT_TYPE_LABELS: Record<string, string> = {
  // P0
  noindex_added: 'Noindex ajouté',
  status_code_changed: 'Code HTTP modifié',
  canonical_missing: 'Canonical manquant',
  canonical_changed: 'Canonical modifié',
  meta_title_missing: 'Meta title supprimé',
  soft_404: 'Soft 404 détecté',
  redirect_to_homepage: 'Redirection vers la homepage',
  // P1
  ssr_rendering_failed: 'SSR cassé',
  ssr_content_mismatch: 'Écart SSR/CSR',
  h1_missing: 'H1 supprimé',
  h1_multiple: 'H1 multiples',
  h1_changed: 'H1 modifié',
  viewport_missing: 'Viewport supprimé',
  thin_content: 'Contenu trop mince',
  content_removed: 'Contenu supprimé',
  hreflang_removed: 'Hreflang supprimé',
  hreflang_changed: 'Hreflang modifié',
  title_duplicate_of_h1: 'Title = H1',
  https_mixed_content: 'Ressources HTTP sur page HTTPS',
  // P2
  meta_description_missing: 'Meta description supprimée',
  structured_data_removed: 'Données structurées supprimées',
  structured_data_error: 'JSON-LD invalide',
  og_image_removed: 'og:image supprimé',
  og_title_removed: 'og:title supprimé',
  meta_refresh_detected: 'Meta refresh détecté',
  robots_txt_changed: 'Robots.txt modifié',
  // P3
  heading_hierarchy_broken: 'Hiérarchie des titres cassée',
  lang_attribute_missing: 'Attribut lang supprimé',
  lang_attribute_changed: 'Attribut lang modifié',
  word_count_changed: 'Volume de contenu modifié',
  charset_missing: 'Charset supprimé',
  ssr_blocked: 'Crawler bloqué (anti-bot)',
  ssr_title_mismatch: 'Title SSR ≠ CSR',
  ssr_meta_description_mismatch: 'Description SSR ≠ CSR',
  meta_title_changed: 'Meta title modifié',
  meta_description_changed: 'Meta description modifiée',
  // GEO — monitoring
  llms_txt_removed: '/llms.txt supprimé',
  ai_crawlers_blocked_changed: 'Crawlers IA bloqués',
  faq_schema_removed: 'FAQ schema supprimé',
  structured_data_author_removed: 'Auteur supprimé (JSON-LD)',
  // Recommendations
  rec_img_alt_audit: 'Images sans alt',
  rec_img_alt_missing_in_ssr: 'Images sans alt absentes du HTML brut (injectées par JavaScript)',
  rec_title_length_audit: 'Longueur du title',
  rec_description_length_audit: 'Longueur de la description',
  rec_h1_missing_audit: 'H1 manquant',
  rec_h1_missing_in_ssr: 'H1 absent du HTML brut (rempli par JavaScript)',
  rec_favicon_missing_audit: 'Favicon manquant',
  rec_semantic_structure_audit: 'Structure sémantique',
  rec_semantic_structure_missing_in_ssr: 'Balises sémantiques absentes du HTML brut',
  rec_structured_data_missing_audit: 'Données structurées manquantes',
  rec_structured_data_missing_in_ssr: 'JSON-LD absent du HTML brut (injecté par JavaScript)',
  rec_og_missing_audit: 'Open Graph manquant',
  rec_internal_links_audit: 'Liens internes insuffisants',
  rec_internal_links_missing_in_ssr: 'Liens internes absents du HTML brut (injectés par JavaScript)',
  // GEO — recommendations
  rec_llms_txt_missing: '/llms.txt manquant',
  rec_ai_crawlers_blocked: 'Crawlers IA bloqués (robots.txt)',
  rec_structured_data_incomplete: 'Données structurées incomplètes',
  rec_faq_schema_missing: 'FAQ schema manquant',
  rec_citation_signals_missing: 'Signaux de citation faibles',
  rec_content_structure_audit: 'Structure de contenu (GEO)',
}

export const STATE_RULES: Set<string> = new Set([
  'soft_404', 'meta_refresh_detected', 'https_mixed_content',
  'structured_data_error', 'redirect_to_homepage',
  'ssr_content_mismatch', 'ssr_rendering_failed',
  'ssr_title_mismatch', 'ssr_meta_description_mismatch', 'ssr_blocked',
])

export const RECOMMENDATION_RULES: Set<string> = new Set([
  'rec_img_alt_audit', 'rec_img_alt_missing_in_ssr',
  'rec_title_length_audit', 'rec_description_length_audit',
  'rec_h1_missing_audit', 'rec_h1_missing_in_ssr',
  'rec_favicon_missing_audit',
  'rec_semantic_structure_audit', 'rec_semantic_structure_missing_in_ssr',
  'rec_structured_data_missing_audit', 'rec_structured_data_missing_in_ssr',
  'rec_og_missing_audit',
  'rec_internal_links_audit', 'rec_internal_links_missing_in_ssr',
  // GEO
  'rec_llms_txt_missing', 'rec_ai_crawlers_blocked',
  'rec_structured_data_incomplete', 'rec_faq_schema_missing',
  'rec_citation_signals_missing', 'rec_content_structure_audit',
])

export function getRuleCategory(ruleId: string): AlertCategory {
  if (STATE_RULES.has(ruleId)) return 'state'
  if (RECOMMENDATION_RULES.has(ruleId)) return 'recommendation'
  return 'event'
}

export const ALERT_STATUS_LABELS: Record<string, string> = {
  open: 'Ouvertes',
  resolved: 'Résolues',
}

export const CRAWL_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  running: 'En cours',
  completed: 'Terminé',
  failed: 'Échoué',
}
