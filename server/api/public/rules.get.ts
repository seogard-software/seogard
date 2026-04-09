import { ALERT_TYPE_LABELS, getRuleCategory } from '../../../shared/utils/constants'

const RULES = [
  // P0 — Deindexation
  { id: 'noindex_added', severity: 'critical', type: 'cross-crawl', file: 'indexing.ts', priority: 'P0', description: 'Une directive noindex a été ajoutée. La page va disparaître des résultats Google sous quelques jours.' },
  { id: 'status_code_changed', severity: 'critical/warning', type: 'cross-crawl', file: 'status-code.ts', priority: 'P0', description: 'Le code HTTP a changé (ex : 200 → 404 ou 301). Critical si erreur serveur (4xx/5xx), warning si redirection (3xx).' },
  { id: 'canonical_missing', severity: 'critical', type: 'cross-crawl', file: 'meta.ts', priority: 'P0', description: 'La balise canonical a disparu. Risque de contenu dupliqué — Google ne sait plus quelle URL indexer.' },
  { id: 'canonical_changed', severity: 'warning', type: 'cross-crawl', file: 'meta.ts', priority: 'P0', description: 'La balise canonical pointe vers une URL différente. Peut être voulu (migration) ou accidentel.' },
  { id: 'meta_title_missing', severity: 'critical', type: 'cross-crawl', file: 'meta.ts', priority: 'P0', description: 'Le meta title a disparu. Google affichera un titre généré automatiquement dans les résultats de recherche.' },
  { id: 'soft_404', severity: 'critical', type: 'within-crawl', file: 'content.ts', priority: 'P0', description: 'La page renvoie un code 200 mais affiche un message "page introuvable". Google la considère comme supprimée.' },
  { id: 'redirect_to_homepage', severity: 'critical', type: 'within-crawl', file: 'redirect.ts', priority: 'P0', description: 'La page redirige vers la homepage. Tout le contenu et le référencement de cette URL sont perdus.' },
  // P1 — Direct ranking
  { id: 'ssr_rendering_failed', severity: 'critical', type: 'within-crawl', file: 'ssr-csr.ts', priority: 'P1', description: 'Le HTML renvoyé par le serveur (SSR) est quasiment vide alors que la page fonctionne côté navigateur. Google indexe une page vide.' },
  { id: 'ssr_content_mismatch', severity: 'critical', type: 'within-crawl', file: 'ssr-csr.ts', priority: 'P1', description: 'Le contenu SSR représente moins de 10% du contenu affiché par le navigateur. Google voit une version très appauvrie de la page.' },
  { id: 'h1_missing', severity: 'critical', type: 'cross-crawl', file: 'heading.ts', priority: 'P1', description: 'Le H1 a disparu. C\'est le titre principal de la page — un signal SEO fort pour Google.' },
  { id: 'h1_multiple', severity: 'warning', type: 'cross-crawl', file: 'heading.ts', priority: 'P1', description: 'Plusieurs H1 détectés. Cela dilue le signal SEO — une page ne devrait avoir qu\'un seul titre principal.' },
  { id: 'h1_changed', severity: 'warning', type: 'cross-crawl', file: 'heading.ts', priority: 'P1', description: 'Le texte du H1 a changé. Peut être voulu (mise à jour éditoriale) ou accidentel (bug de template).' },
  { id: 'viewport_missing', severity: 'critical', type: 'cross-crawl', file: 'technical.ts', priority: 'P1', description: 'La balise viewport a disparu. La page n\'est plus adaptée au mobile — Google pénalise en mobile-first indexing.' },
  { id: 'thin_content', severity: 'warning', type: 'cross-crawl', file: 'content.ts', priority: 'P1', description: 'Le contenu est passé sous 200 mots. Les pages avec peu de contenu ont moins de chances de ranker.' },
  { id: 'content_removed', severity: 'critical', type: 'cross-crawl', file: 'content.ts', priority: 'P1', description: 'Plus de 50% du contenu a disparu. Suppression massive — probablement un bug de déploiement ou de template.' },
  { id: 'hreflang_removed', severity: 'critical', type: 'cross-crawl', file: 'i18n.ts', priority: 'P1', description: 'Toutes les balises hreflang ont été supprimées. Le ciblage international est cassé — Google peut servir la mauvaise langue.' },
  { id: 'hreflang_changed', severity: 'warning', type: 'cross-crawl', file: 'i18n.ts', priority: 'P1', description: 'Les langues déclarées dans les hreflang ont changé. Peut être voulu (ajout/retrait de langue) ou accidentel.' },
  { id: 'title_duplicate_of_h1', severity: 'info', type: 'cross-crawl', file: 'heading.ts', priority: 'P1', description: 'Le meta title et le H1 sont identiques. Opportunité manquée — varier les deux permet de cibler plus de mots-clés.' },
  { id: 'https_mixed_content', severity: 'warning', type: 'within-crawl', file: 'technical.ts', priority: 'P1', description: 'Des images, scripts ou styles sont chargés en HTTP sur une page HTTPS. Le cadenas de sécurité disparaît et les navigateurs peuvent bloquer ces ressources.' },
  // P2 — CTR / SERP
  { id: 'meta_description_missing', severity: 'critical', type: 'cross-crawl', file: 'meta.ts', priority: 'P2', description: 'La meta description a disparu. Google générera un extrait automatique souvent moins pertinent — impact sur le taux de clic.' },
  { id: 'structured_data_removed', severity: 'warning', type: 'cross-crawl', file: 'structured-data.ts', priority: 'P2', description: 'Les données structurées (JSON-LD) ont été supprimées. Perte des rich snippets (étoiles, prix, FAQ) dans les résultats Google.' },
  { id: 'structured_data_error', severity: 'warning', type: 'within-crawl', file: 'structured-data.ts', priority: 'P2', description: 'Le JSON-LD est invalide (erreur de syntaxe). Google ignore les données structurées mal formées.' },
  { id: 'og_image_removed', severity: 'warning', type: 'cross-crawl', file: 'opengraph.ts', priority: 'P2', description: 'L\'image Open Graph a été supprimée. Les partages sur les réseaux sociaux n\'afficheront plus de visuel.' },
  { id: 'og_title_removed', severity: 'warning', type: 'cross-crawl', file: 'opengraph.ts', priority: 'P2', description: 'Le titre Open Graph a été supprimé. Les réseaux sociaux utiliseront le meta title comme fallback.' },
  { id: 'meta_refresh_detected', severity: 'warning', type: 'within-crawl', file: 'technical.ts', priority: 'P2', description: 'Une balise meta refresh redirige la page. Mauvaise pratique — utilisez une redirection HTTP 301 à la place.' },
  { id: 'robots_txt_changed', severity: 'warning', type: 'cross-crawl', file: 'indexing.ts', priority: 'P2', description: 'Les directives robots ont changé (hors noindex). Vérifiez que les bons crawlers ont toujours accès aux bonnes pages.' },
  // P3 — Quality
  { id: 'heading_hierarchy_broken', severity: 'warning', type: 'cross-crawl', file: 'heading.ts', priority: 'P3', description: 'Saut de niveau dans les titres (ex : H1 → H3 sans H2). Casse la structure sémantique et l\'accessibilité.' },
  { id: 'lang_attribute_missing', severity: 'warning', type: 'cross-crawl', file: 'i18n.ts', priority: 'P3', description: 'L\'attribut lang du HTML a disparu. Google peut mal identifier la langue de la page.' },
  { id: 'lang_attribute_changed', severity: 'warning', type: 'cross-crawl', file: 'i18n.ts', priority: 'P3', description: 'L\'attribut lang a changé (ex : fr → en). Peut casser le ciblage linguistique si c\'est accidentel.' },
  { id: 'word_count_changed', severity: 'info', type: 'cross-crawl', file: 'content.ts', priority: 'P3', description: 'Le volume de contenu a changé de 30 à 50%. Changement notable mais pas catastrophique — à vérifier.' },
  { id: 'charset_missing', severity: 'warning', type: 'cross-crawl', file: 'technical.ts', priority: 'P3', description: 'La déclaration charset a disparu. Risque de caractères mal affichés (accents, emojis) sur certains navigateurs.' },
  { id: 'ssr_title_mismatch', severity: 'warning', type: 'within-crawl', file: 'ssr-csr.ts', priority: 'P3', description: 'Le titre dans le HTML serveur (SSR) est différent du titre affiché par le navigateur (CSR). Google indexe la version SSR.' },
  { id: 'ssr_meta_description_mismatch', severity: 'warning', type: 'within-crawl', file: 'ssr-csr.ts', priority: 'P3', description: 'La meta description SSR est différente de celle rendue côté navigateur. Google utilise la version SSR.' },
  { id: 'meta_title_changed', severity: 'warning', type: 'cross-crawl', file: 'meta.ts', priority: 'P3', description: 'Le meta title a été modifié. Peut être voulu (A/B test, rebrand) ou accidentel (bug de template).' },
  { id: 'meta_description_changed', severity: 'info', type: 'cross-crawl', file: 'meta.ts', priority: 'P3', description: 'La meta description a été modifiée. Rarement un problème — souvent une mise à jour éditoriale.' },
  { id: 'ssr_blocked', severity: 'warning', type: 'within-crawl', file: 'worker.ts', priority: 'P3', description: 'Le crawler a reçu une page de challenge anti-bot (Cloudflare, Akamai, etc.) au lieu du vrai contenu. Les données de cette page ne sont pas fiables.' },
  // GEO — monitoring
  { id: 'llms_txt_removed', severity: 'critical', type: 'site-level', file: 'geo.ts', priority: 'GEO', description: 'Le fichier /llms.txt a été supprimé. Les IA (ChatGPT, Claude, Perplexity) perdent le contexte structuré de votre site.' },
  { id: 'ai_crawlers_blocked_changed', severity: 'warning', type: 'site-level', file: 'geo.ts', priority: 'GEO', description: 'Le robots.txt bloque de nouveaux crawlers IA. Peut être volontaire (RGPD, contenu premium) ou accidentel.' },
  { id: 'faq_schema_removed', severity: 'warning', type: 'cross-crawl', file: 'geo.ts', priority: 'GEO', description: 'Le schema FAQPage a été supprimé. Perte de visibilité dans les AI Overviews et les rich snippets FAQ de Google.' },
  { id: 'structured_data_author_removed', severity: 'critical', type: 'cross-crawl', file: 'geo.ts', priority: 'GEO', description: 'L\'auteur a disparu des données structurées. Les IA citent moins les contenus anonymes — perte de crédibilité.' },
  // Recommendations
  { id: 'rec_img_alt_audit', severity: 'info/warning', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC', description: 'Des images n\'ont pas d\'attribut alt. Important pour l\'accessibilité et le référencement des images. Warning si 10+ images concernées.' },
  { id: 'rec_title_length_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC', description: 'Le meta title est trop court (< 15 caractères) ou trop long (> 60 caractères). Google risque de le tronquer ou de le réécrire.' },
  { id: 'rec_description_length_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC', description: 'La meta description est trop courte (< 50 caractères) ou trop longue (> 160 caractères). Idéalement entre 120 et 155 caractères.' },
  { id: 'rec_h1_missing_audit', severity: 'warning', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC', description: 'Aucun H1 sur la page. Le titre principal est un signal SEO fort — chaque page devrait en avoir un.' },
  { id: 'rec_favicon_missing_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC', description: 'Pas de favicon détecté. Impact mineur mais visible dans les onglets du navigateur et les résultats Google.' },
  { id: 'rec_semantic_structure_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC', description: 'Balises sémantiques manquantes (main, header, footer). Améliore l\'accessibilité et aide les moteurs à comprendre la structure.' },
  { id: 'rec_structured_data_missing_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC', description: 'Aucune donnée structurée (JSON-LD) détectée. Vous passez à côté des rich snippets dans les résultats Google.' },
  { id: 'rec_og_missing_audit', severity: 'info', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC', description: 'Balises Open Graph manquantes (og:title, og:description ou og:image). Les partages sociaux seront moins attractifs.' },
  { id: 'rec_internal_links_audit', severity: 'info/warning', type: 'within-crawl', file: 'recommendations.ts', priority: 'REC', description: 'Moins de 3 liens internes sur la page. Warning si aucun lien — la page est orpheline et mal maillée.' },
  // GEO — recommendations
  { id: 'rec_llms_txt_missing', severity: 'info', type: 'site-level', file: 'geo.ts', priority: 'GEO-REC', description: 'Pas de fichier /llms.txt détecté. Ce fichier aide les IA à comprendre votre site — recommandé pour la visibilité IA.' },
  { id: 'rec_ai_crawlers_blocked', severity: 'warning', type: 'site-level', file: 'geo.ts', priority: 'GEO-REC', description: 'Le robots.txt bloque des crawlers IA (GPTBot, ClaudeBot, etc.). Votre contenu est invisible pour ces IA.' },
  { id: 'rec_structured_data_incomplete', severity: 'info', type: 'within-crawl', file: 'geo.ts', priority: 'GEO-REC', description: 'Les données structurées existent mais sont incomplètes (auteur, date ou publisher manquant). Les IA exploitent ces champs pour citer vos contenus.' },
  { id: 'rec_faq_schema_missing', severity: 'info', type: 'within-crawl', file: 'geo.ts', priority: 'GEO-REC', description: 'Pas de schema FAQPage alors que la page a du contenu (> 300 mots). Les FAQ augmentent les chances d\'apparaître dans les AI Overviews.' },
  { id: 'rec_citation_signals_missing', severity: 'info', type: 'within-crawl', file: 'geo.ts', priority: 'GEO-REC', description: 'Plusieurs signaux de citation manquent (auteur, date, sources). Les IA privilégient les contenus attribuables et datés.' },
  { id: 'rec_content_structure_audit', severity: 'info', type: 'within-crawl', file: 'geo.ts', priority: 'GEO-REC', description: 'Le contenu n\'a ni sous-titres (H2) ni listes. Les IA extraient mieux l\'information quand le contenu est bien structuré.' },
].map(r => ({
  ...r,
  label: ALERT_TYPE_LABELS[r.id] || r.id,
  category: getRuleCategory(r.id),
}))

const PRIORITY_META: Record<string, { label: string; description: string }> = {
  P0: { label: 'P0 — Désindexation', description: 'Les pages disparaissent de Google' },
  P1: { label: 'P1 — Ranking direct', description: 'Impact direct confirmé sur le positionnement' },
  P2: { label: 'P2 — CTR / SERP', description: 'Apparence dans les résultats de recherche' },
  P3: { label: 'P3 — Qualité', description: 'Best practices, impact indirect' },
  GEO: { label: 'GEO — Visibilité IA', description: 'Monitoring des signaux LLM/IA' },
  REC: { label: 'Recommandations', description: 'Audit — vérifications à chaque crawl' },
  'GEO-REC': { label: 'Recommandations GEO', description: 'Audit — signaux de visibilité IA' },
}

export default defineEventHandler(() => {
  const groups: Record<string, { label: string; description: string; rules: typeof RULES }> = {}
  for (const rule of RULES) {
    if (!groups[rule.priority]) {
      const meta = PRIORITY_META[rule.priority]
      groups[rule.priority] = { ...meta, rules: [] }
    }
    groups[rule.priority].rules.push(rule)
  }

  return {
    total: RULES.length,
    monitoring: RULES.filter(r => !r.priority.includes('REC')).length,
    recommendations: RULES.filter(r => r.priority.includes('REC')).length,
    groups,
  }
})
