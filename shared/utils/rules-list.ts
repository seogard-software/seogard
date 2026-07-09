// Liste brute des règles = id + métadonnées techniques (severity/type/file/priority).
// AUCUN import de rules.json ni de constants ici : c'est ce qui permet à RULES_COUNT (utilisé
// sur la landing) de ne PAS tirer les ~130 KB de wording des règles dans le bundle client.
// Source unique de la liste — rules-catalog.ts consomme RAW_RULES pour construire le catalogue localisé.
export const RAW_RULES = [
  // P0 — Deindexation
  { id: 'noindex_added', severity: 'critical', type: 'cross-crawl', file: 'indexing.ts', priority: 'P0' },
  { id: 'status_code_changed', severity: 'critical/warning', type: 'cross-crawl', file: 'status-code.ts', priority: 'P0' },
  { id: 'canonical_missing', severity: 'critical', type: 'cross-crawl', file: 'meta.ts', priority: 'P0' },
  { id: 'canonical_changed', severity: 'warning', type: 'cross-crawl', file: 'meta.ts', priority: 'P0' },
  { id: 'meta_title_missing', severity: 'critical', type: 'cross-crawl', file: 'meta.ts', priority: 'P0' },
  { id: 'soft_404', severity: 'critical', type: 'within-crawl', file: 'content.ts', priority: 'P0' },
  { id: 'redirect_to_homepage', severity: 'critical', type: 'within-crawl', file: 'redirect.ts', priority: 'P0' },
  { id: 'page_redirected', severity: 'warning', type: 'cross-crawl', file: 'redirect.ts', priority: 'P1' },
  { id: 'js_redirect_detected', severity: 'warning', type: 'within-crawl', file: 'redirect.ts', priority: 'P1' },
  { id: 'redirect_broken', severity: 'warning', type: 'cross-crawl', file: 'redirect.ts', priority: 'P1' },
  { id: 'rec_redirect_temporary', severity: 'info', type: 'cross-crawl', file: 'redirect.ts', priority: 'P2' },
  { id: 'rec_unclean_removal', severity: 'info', type: 'cross-crawl', file: 'redirect.ts', priority: 'P2' },
  { id: 'rec_sitemap_noindex_conflict', severity: 'warning', type: 'within-crawl', file: 'indexing.ts', priority: 'P2' },
  // P1 — Direct ranking
  { id: 'ssr_rendering_failed', severity: 'critical', type: 'within-crawl', file: 'ssr-csr.ts', priority: 'P1' },
  { id: 'ssr_content_mismatch', severity: 'critical', type: 'within-crawl', file: 'ssr-csr.ts', priority: 'P1' },
  { id: 'h1_missing', severity: 'critical', type: 'cross-crawl', file: 'heading.ts', priority: 'P1' },
  { id: 'h1_multiple', severity: 'warning', type: 'cross-crawl', file: 'heading.ts', priority: 'P1' },
  { id: 'h1_changed', severity: 'warning', type: 'cross-crawl', file: 'heading.ts', priority: 'P1' },
  { id: 'viewport_missing', severity: 'critical', type: 'cross-crawl', file: 'technical.ts', priority: 'P1' },
  { id: 'thin_content', severity: 'warning', type: 'cross-crawl', file: 'content.ts', priority: 'P1' },
  { id: 'content_removed', severity: 'critical', type: 'cross-crawl', file: 'content.ts', priority: 'P1' },
  { id: 'hreflang_removed', severity: 'critical', type: 'cross-crawl', file: 'i18n.ts', priority: 'P1' },
  { id: 'hreflang_changed', severity: 'warning', type: 'cross-crawl', file: 'i18n.ts', priority: 'P1' },
  { id: 'https_mixed_content', severity: 'warning', type: 'within-crawl', file: 'technical.ts', priority: 'P1' },
  // P2 — CTR / SERP
  { id: 'meta_description_missing', severity: 'warning', type: 'cross-crawl', file: 'meta.ts', priority: 'P2' },
  { id: 'structured_data_removed', severity: 'warning', type: 'cross-crawl', file: 'structured-data.ts', priority: 'P2' },
  { id: 'structured_data_error', severity: 'warning', type: 'within-crawl', file: 'structured-data.ts', priority: 'P2' },
  { id: 'og_image_removed', severity: 'warning', type: 'cross-crawl', file: 'opengraph.ts', priority: 'P2' },
  { id: 'og_title_removed', severity: 'warning', type: 'cross-crawl', file: 'opengraph.ts', priority: 'P2' },
  { id: 'meta_refresh_detected', severity: 'warning', type: 'within-crawl', file: 'technical.ts', priority: 'P2' },
  { id: 'robots_txt_changed', severity: 'warning', type: 'cross-crawl', file: 'indexing.ts', priority: 'P2' },
  // P3 — Quality
  { id: 'heading_hierarchy_broken', severity: 'info', type: 'cross-crawl', file: 'heading.ts', priority: 'P3' },
  { id: 'lang_attribute_missing', severity: 'warning', type: 'cross-crawl', file: 'i18n.ts', priority: 'P3' },
  { id: 'lang_attribute_changed', severity: 'warning', type: 'cross-crawl', file: 'i18n.ts', priority: 'P3' },
  { id: 'word_count_changed', severity: 'info', type: 'cross-crawl', file: 'content.ts', priority: 'P3' },
  { id: 'charset_missing', severity: 'warning', type: 'cross-crawl', file: 'technical.ts', priority: 'P3' },
  { id: 'ssr_title_mismatch', severity: 'warning', type: 'within-crawl', file: 'ssr-csr.ts', priority: 'P3' },
  { id: 'ssr_meta_description_mismatch', severity: 'warning', type: 'within-crawl', file: 'ssr-csr.ts', priority: 'P3' },
  { id: 'meta_title_changed', severity: 'warning', type: 'cross-crawl', file: 'meta.ts', priority: 'P3' },
  { id: 'meta_description_changed', severity: 'info', type: 'cross-crawl', file: 'meta.ts', priority: 'P3' },
  { id: 'ssr_blocked', severity: 'warning', type: 'within-crawl', file: 'worker.ts', priority: 'P3' },
  // GEO — monitoring
  { id: 'llms_txt_removed', severity: 'info', type: 'site-level', file: 'geo.ts', priority: 'GEO' },
  { id: 'ai_crawlers_blocked_changed', severity: 'warning', type: 'site-level', file: 'geo.ts', priority: 'GEO' },
  { id: 'robots_blocks_googlebot', severity: 'critical', type: 'site-level', file: 'geo.ts', priority: 'P0' },
  { id: 'faq_schema_removed', severity: 'info', type: 'cross-crawl', file: 'geo.ts', priority: 'GEO' },
  { id: 'structured_data_author_removed', severity: 'warning', type: 'cross-crawl', file: 'geo.ts', priority: 'GEO' },
  // Recommendations
  { id: 'rec_img_alt_audit', severity: 'info/warning', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_title_length_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_description_length_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_h1_missing_audit', severity: 'warning', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_h1_missing_in_ssr', severity: 'warning', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_content_missing_in_ssr', severity: 'warning', type: 'within-crawl', file: 'recommendations.ts', priority: 'GEO-REC' },
  { id: 'rec_title_missing_in_ssr', severity: 'warning', type: 'within-crawl', file: 'recommendations.ts', priority: 'GEO-REC' },
  { id: 'rec_description_missing_in_ssr', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'GEO-REC' },
  { id: 'rec_internal_links_missing_in_ssr', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_structured_data_missing_in_ssr', severity: 'warning', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_img_alt_missing_in_ssr', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_semantic_structure_missing_in_ssr', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_favicon_missing_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_semantic_structure_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_structured_data_missing_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_og_missing_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  { id: 'rec_internal_links_audit', severity: 'info/warning', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC' },
  // GEO — recommendations
  { id: 'rec_llms_txt_missing', severity: 'info', type: 'site-level', file: 'geo.ts', priority: 'GEO-REC' },
  { id: 'rec_ai_crawlers_blocked', severity: 'warning', type: 'site-level', file: 'geo.ts', priority: 'GEO-REC' },
  { id: 'rec_structured_data_incomplete', severity: 'info', type: 'within-crawl', file: 'geo.ts', priority: 'GEO-REC' },
  { id: 'rec_faq_schema_missing', severity: 'info', type: 'within-crawl', file: 'geo.ts', priority: 'GEO-REC' },
  { id: 'rec_citation_signals_missing', severity: 'info', type: 'within-crawl', file: 'geo.ts', priority: 'GEO-REC' },
  { id: 'rec_content_structure_audit', severity: 'info', type: 'within-crawl', file: 'geo.ts', priority: 'GEO-REC' },
  // Performance — poids de page (LCP/CLS/TTFB = monitoring synthétique, sans alerte)
  { id: 'perf_page_weight_explosion', severity: 'warning', type: 'within-crawl', file: 'performance.ts', priority: 'PERF' },
  { id: 'rec_perf_page_heavy', severity: 'info/warning', type: 'within-crawl', file: 'performance.ts', priority: 'PERF-REC' },
]

// SOURCE UNIQUE du nombre de règles affiché sur le site (home, scanner, outils, llms.txt…).
// JAMAIS de littéral en dur dans les pages : le test rules-count.test.ts casse le build sinon.
export const RULES_COUNT = RAW_RULES.length
