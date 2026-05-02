import { registerRule } from './engine'

// Recommendation rules check absolute state (no oldMeta required).
// They fire on every crawl to surface SEO best-practice issues.

registerRule({
  id: 'rec_img_alt_audit',
  run(ctx) {
    const count = ctx.newMeta.images?.filter(i => !i.alt).length ?? 0
    if (count === 0) return []
    return [{
      type: 'rec_img_alt_audit',
      severity: count >= 10 ? 'warning' : 'info',
      message: `${count} image(s) sans attribut alt`,
      previousValue: null,
      currentValue: `${count} images sans alt`,
    }]
  },
})

registerRule({
  id: 'rec_title_length_audit',
  run(ctx) {
    const title = ctx.newMeta.title
    if (!title) return [] // handled by meta_title_missing
    const len = title.length
    if (len >= 15 && len <= 60) return []
    const issue = len < 15 ? 'trop court' : 'trop long'
    return [{
      type: 'rec_title_length_audit',
      severity: 'info',
      message: `Title ${issue} (${len} caractères, recommandé : 15-60)`,
      previousValue: null,
      currentValue: `${len} caractères`,
    }]
  },
})

registerRule({
  id: 'rec_description_length_audit',
  run(ctx) {
    const desc = ctx.newMeta.description
    if (!desc) return [] // handled by meta_description_missing
    const len = desc.length
    if (len >= 50 && len <= 160) return []
    const issue = len < 50 ? 'trop courte' : 'trop longue'
    return [{
      type: 'rec_description_length_audit',
      severity: 'info',
      message: `Meta description ${issue} (${len} caractères, recommandé : 50-160)`,
      previousValue: null,
      currentValue: `${len} caractères`,
    }]
  },
})

// rec_h1_missing_audit — fire si AUCUN H1 utile (texte non vide) dans le DOM rendu (CSR).
// Ne tourne qu'en phase CSR pour ne pas crier au loup sur les SPA qui injectent leur H1 par JS.
// Si la page n'a vraiment aucun H1, le CSR le confirmera et l'alerte fire.
registerRule({
  id: 'rec_h1_missing_audit',
  run(ctx) {
    // Skip en phase SSR : on attend le CSR pour avoir l'etat final
    if (!ctx.renderedMeta?.headings) return []

    const h1sWithText = ctx.renderedMeta.headings.filter(h => h.level === 1 && h.text.length > 0)
    if (h1sWithText.length > 0) return []
    return [{
      type: 'rec_h1_missing_audit',
      severity: 'warning',
      message: 'Aucun H1 trouvé sur la page',
      previousValue: null,
      currentValue: '0 H1',
    }]
  },
})

// rec_h1_missing_in_ssr — fire si le H1 est absent ou vide en SSR (HTML brut)
// MAIS rempli en CSR (apres hydration JavaScript).
// C'est un probleme SEO : Google indexe le SSR au premier crawl, le H1 est manque
// pendant des heures/jours avant le rendering. Les LLM lisent quasi exclusivement
// le HTML brut donc ne verront jamais ce H1.
registerRule({
  id: 'rec_h1_missing_in_ssr',
  run(ctx) {
    // Necessite une comparaison SSR vs CSR
    if (!ctx.renderedMeta?.headings) return []

    const ssrH1s = ctx.newMeta.headings?.filter(h => h.level === 1 && h.text.length > 0) ?? []
    const csrH1s = ctx.renderedMeta.headings.filter(h => h.level === 1 && h.text.length > 0)

    // SSR a un H1 utile → pas de probleme
    if (ssrH1s.length > 0) return []
    // CSR n'a pas de H1 non plus → c'est rec_h1_missing_audit qui prend le relais
    if (csrH1s.length === 0) return []

    // SSR sans H1 utile MAIS CSR avec H1 → probleme specifique
    const csrH1Text = csrH1s[0].text
    return [{
      type: 'rec_h1_missing_in_ssr',
      severity: 'warning',
      message: `H1 absent ou vide en SSR mais rempli côté JavaScript ("${csrH1Text}"). Google peut le voir avec délai (24h à plusieurs semaines). Les LLM (ChatGPT, Perplexity, Claude) ne le voient probablement jamais — ils lisent principalement le HTML brut.`,
      previousValue: null,
      currentValue: csrH1Text,
    }]
  },
})

registerRule({
  id: 'rec_favicon_missing_audit',
  run(ctx) {
    if (ctx.newMeta.favicon) return []
    return [{
      type: 'rec_favicon_missing_audit',
      severity: 'info',
      message: 'Aucun favicon détecté',
      previousValue: null,
      currentValue: null,
    }]
  },
})

registerRule({
  id: 'rec_semantic_structure_audit',
  run(ctx) {
    const missing: string[] = []
    if (!ctx.newMeta.hasMain) missing.push('<main>')
    if (!ctx.newMeta.hasHeader) missing.push('<header>')
    if (!ctx.newMeta.hasFooter) missing.push('<footer>')
    if (missing.length === 0) return []
    return [{
      type: 'rec_semantic_structure_audit',
      severity: 'info',
      message: `Balises sémantiques manquantes : ${missing.join(', ')}`,
      previousValue: null,
      currentValue: missing.join(', '),
    }]
  },
})

registerRule({
  id: 'rec_structured_data_missing_audit',
  run(ctx) {
    if (ctx.newMeta.jsonLdTypes.length > 0) return []
    return [{
      type: 'rec_structured_data_missing_audit',
      severity: 'info',
      message: 'Aucune donnée structurée JSON-LD détectée',
      previousValue: null,
      currentValue: null,
    }]
  },
})

registerRule({
  id: 'rec_og_missing_audit',
  run(ctx) {
    const missing: string[] = []
    if (!ctx.newMeta.ogTitle) missing.push('og:title')
    if (!ctx.newMeta.ogDescription) missing.push('og:description')
    if (!ctx.newMeta.ogImage) missing.push('og:image')
    if (missing.length === 0) return []
    return [{
      type: 'rec_og_missing_audit',
      severity: 'info',
      message: `Balises Open Graph manquantes : ${missing.join(', ')}`,
      previousValue: null,
      currentValue: missing.join(', '),
    }]
  },
})

registerRule({
  id: 'rec_internal_links_audit',
  run(ctx) {
    const count = ctx.newMeta.internalLinkCount
    if (count >= 3) return []
    return [{
      type: 'rec_internal_links_audit',
      severity: count === 0 ? 'warning' : 'info',
      message: `Seulement ${count} lien(s) interne(s) (recommandé : >= 3)`,
      previousValue: null,
      currentValue: `${count} liens internes`,
    }]
  },
})
