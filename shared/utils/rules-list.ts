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

// ── Publication des fiches /docs/rules/[slug] — PAR VAGUES (pas d'un bloc) ──
// Le domaine sort d'une purge de 308 articles générés : publier 71 pages template d'un coup
// rallume le signal doorway. On publie donc vague par vague, chaque fiche relue mot à mot par
// @seo-strategist (FR ET EN) avant d'entrer ici. Le code d'auto-création reste ; SEUL le
// sitemap/hub/llms.txt se gate sur cette liste → une fiche non publiée n'existe pas pour Google.
// TOUTES les règles sont publiées en fiche : décision produit 2026-07 (plus aucune modale « En
// savoir plus » sur le hub — chaque règle = une page SSR indexable). Contenu FR+EN rédigé et validé
// pour les 71. Le test verrouille : tout id publié a tldr/exemple/scanHook dans les 2 langues.
export const PUBLISHED_RULE_IDS: ReadonlySet<string> = new Set<string>(RAW_RULES.map(r => r.id))

export function isRulePublished(id: string): boolean {
  return PUBLISHED_RULE_IDS.has(id)
}

// Ids publiés dans l'ordre du catalogue (pour sitemap / hub / llms.txt).
export function getPublishedRuleIds(): string[] {
  return RAW_RULES.map(r => r.id).filter(isRulePublished)
}

// ── Paires jumelles event ↔ recommendation (même élément, intention de recherche DIFFÉRENTE) ──
// La régression (event) répond à « détecter/après un déploiement » ; l'audit (reco) répond à
// « c'est quoi / comment corriger ». On croise les deux fiches explicitement pour éviter la
// cannibalisation (title/H1 différenciés + cross-link). Le cross-link ne s'affiche que si la
// jumelle est publiée. Bidirectionnel.
const TWIN_PAIRS: readonly [string, string][] = [
  ['h1_missing', 'rec_h1_missing_audit'],
  ['meta_description_missing', 'rec_description_length_audit'],
  ['structured_data_removed', 'rec_structured_data_missing_audit'],
  ['og_image_removed', 'rec_og_missing_audit'],
  ['og_title_removed', 'rec_og_missing_audit'],
  ['llms_txt_removed', 'rec_llms_txt_missing'],
  ['faq_schema_removed', 'rec_faq_schema_missing'],
  ['ai_crawlers_blocked_changed', 'rec_ai_crawlers_blocked'],
  ['structured_data_author_removed', 'rec_citation_signals_missing'],
]

const TWIN_OF: Record<string, string> = Object.fromEntries(
  TWIN_PAIRS.flatMap(([a, b]) => [[a, b], [b, a]]),
)

export function getTwinRuleId(id: string): string | null {
  return TWIN_OF[id] ?? null
}

// Date de dernière révision éditoriale des fiches (affichée + dateModified JSON-LD). À bumper
// quand le contenu d'une vague est mis à jour. Une seule source pour rester honnête et simple.
export const FICHE_UPDATED_AT = '2026-07-09'

// ── « Ce que ce scan vérifie » — cible du CTA par FAMILLE (reco @seo-strategist 2026-07) ──
// 6 familles réutilisées (pas 71 libellés). Le différenciateur SSR/CSR (« HTML brut vs rendu JS »)
// vit UNIQUEMENT dans la famille `ssr` — ailleurs il serait hors sujet (ex : status_code_changed).
// Le wording des 6 familles est dans i18n `docs.fiche.scanTarget.<famille>`.
export type CtaTarget = 'indexing' | 'meta' | 'content' | 'ssr' | 'geo' | 'tech'

const CTA_TARGET_BY_RULE: Record<string, CtaTarget> = {
  // 1 — Indexabilité / statut
  noindex_added: 'indexing', status_code_changed: 'indexing', canonical_missing: 'indexing',
  canonical_changed: 'indexing', soft_404: 'indexing', redirect_to_homepage: 'indexing',
  page_redirected: 'indexing', js_redirect_detected: 'indexing', redirect_broken: 'indexing',
  rec_redirect_temporary: 'indexing', rec_unclean_removal: 'indexing', rec_sitemap_noindex_conflict: 'indexing',
  meta_refresh_detected: 'indexing', robots_txt_changed: 'indexing', robots_blocks_googlebot: 'indexing',
  // 2 — Balises meta / SERP
  meta_title_missing: 'meta', meta_description_missing: 'meta', og_image_removed: 'meta',
  og_title_removed: 'meta', meta_title_changed: 'meta', meta_description_changed: 'meta',
  rec_title_length_audit: 'meta', rec_description_length_audit: 'meta', rec_og_missing_audit: 'meta',
  // 3 — Structure de contenu
  h1_missing: 'content', h1_multiple: 'content', h1_changed: 'content', thin_content: 'content',
  content_removed: 'content', heading_hierarchy_broken: 'content', word_count_changed: 'content',
  rec_img_alt_audit: 'content', rec_h1_missing_audit: 'content', rec_favicon_missing_audit: 'content',
  rec_semantic_structure_audit: 'content', rec_internal_links_audit: 'content',
  // 4 — HTML brut vs rendu JS (LE différenciateur — gardé ici seulement)
  ssr_rendering_failed: 'ssr', ssr_content_mismatch: 'ssr', ssr_title_mismatch: 'ssr',
  ssr_meta_description_mismatch: 'ssr', ssr_blocked: 'ssr', rec_h1_missing_in_ssr: 'ssr',
  rec_content_missing_in_ssr: 'ssr', rec_title_missing_in_ssr: 'ssr', rec_description_missing_in_ssr: 'ssr',
  rec_internal_links_missing_in_ssr: 'ssr', rec_structured_data_missing_in_ssr: 'ssr',
  rec_img_alt_missing_in_ssr: 'ssr', rec_semantic_structure_missing_in_ssr: 'ssr',
  // 5 — Signaux de citation IA (GEO)
  structured_data_removed: 'geo', structured_data_error: 'geo', llms_txt_removed: 'geo',
  ai_crawlers_blocked_changed: 'geo', faq_schema_removed: 'geo', structured_data_author_removed: 'geo',
  rec_structured_data_missing_audit: 'geo', rec_llms_txt_missing: 'geo', rec_ai_crawlers_blocked: 'geo',
  rec_structured_data_incomplete: 'geo', rec_faq_schema_missing: 'geo', rec_citation_signals_missing: 'geo',
  rec_content_structure_audit: 'geo',
  // 6 — Conformité technique
  viewport_missing: 'tech', hreflang_removed: 'tech', hreflang_changed: 'tech', https_mixed_content: 'tech',
  lang_attribute_missing: 'tech', lang_attribute_changed: 'tech', charset_missing: 'tech',
  perf_page_weight_explosion: 'tech', rec_perf_page_heavy: 'tech',
}

export function getRuleCtaTarget(id: string): CtaTarget {
  return CTA_TARGET_BY_RULE[id] ?? 'tech'
}

export function isRuleCtaTargetMapped(id: string): boolean {
  return id in CTA_TARGET_BY_RULE
}
