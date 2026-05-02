import { registerRule } from './engine'

// Recommendation rules check absolute state (no oldMeta required).
// They fire on every crawl to surface SEO best-practice issues.

// rec_img_alt_audit — fire si des images du DOM rendu (CSR) n'ont pas d'attribut alt.
// Ne tourne qu'en phase CSR : les images lazy-loaded ou injectees par JS (carrousels,
// galeries dynamiques) ne sont pas dans le SSR. On regarde l'etat final qui compte
// pour l'utilisateur et l'accessibilite.
registerRule({
  id: 'rec_img_alt_audit',
  run(ctx) {
    if (!ctx.renderedMeta?.images) return []

    const count = ctx.renderedMeta.images.filter(i => !i.alt).length
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

// SSR-vs-CSR : H1 vide en HTML brut mais rempli après JS.
// Google retarde l'indexation, les LLM lisent le HTML brut donc ne le voient pas.
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

// rec_semantic_structure_audit — fire si <main>/<header>/<footer> absents du DOM rendu.
// Ne tourne qu'en phase CSR : les frameworks modernes (Next.js, Nuxt) posent souvent
// le layout apres hydration.
registerRule({
  id: 'rec_semantic_structure_audit',
  run(ctx) {
    if (ctx.renderedMeta?.hasMain === undefined) return []

    const missing: string[] = []
    if (!ctx.renderedMeta.hasMain) missing.push('<main>')
    if (!ctx.renderedMeta.hasHeader) missing.push('<header>')
    if (!ctx.renderedMeta.hasFooter) missing.push('<footer>')
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

// rec_semantic_structure_missing_in_ssr — fire si les balises sémantiques sont absentes
// du HTML brut mais présentes après chargement JavaScript. Impact sur l'accessibilité et
// la compréhension de la structure par Google et les lecteurs d'écran au premier rendu.
registerRule({
  id: 'rec_semantic_structure_missing_in_ssr',
  run(ctx) {
    if (ctx.renderedMeta?.hasMain === undefined) return []

    const missingInSsr: string[] = []
    if (!ctx.newMeta.hasMain && ctx.renderedMeta.hasMain) missingInSsr.push('<main>')
    if (!ctx.newMeta.hasHeader && ctx.renderedMeta.hasHeader) missingInSsr.push('<header>')
    if (!ctx.newMeta.hasFooter && ctx.renderedMeta.hasFooter) missingInSsr.push('<footer>')
    if (missingInSsr.length === 0) return []

    return [{
      type: 'rec_semantic_structure_missing_in_ssr',
      severity: 'info',
      message: `Balises sémantiques (${missingInSsr.join(', ')}) absentes du HTML brut envoyé par votre serveur — elles apparaissent uniquement après chargement JavaScript. Google et les lecteurs d'écran (accessibilité) comprennent mieux la structure de votre page quand ces balises sont présentes dès le premier rendu. Solution : structurer votre layout avec ces balises côté serveur.`,
      previousValue: null,
      currentValue: missingInSsr.join(', '),
    }]
  },
})

// rec_structured_data_missing_audit — fire si AUCUN JSON-LD dans le DOM rendu (CSR).
// Ne tourne qu'en phase CSR : beaucoup de CMS injectent leur JSON-LD côté client.
registerRule({
  id: 'rec_structured_data_missing_audit',
  run(ctx) {
    if (!ctx.renderedMeta?.jsonLdTypes) return []

    if (ctx.renderedMeta.jsonLdTypes.length > 0) return []
    return [{
      type: 'rec_structured_data_missing_audit',
      severity: 'info',
      message: 'Aucune donnée structurée JSON-LD détectée',
      previousValue: null,
      currentValue: null,
    }]
  },
})

// SSR-vs-CSR : JSON-LD injecté par JS uniquement → invisible pour les LLM.
registerRule({
  id: 'rec_structured_data_missing_in_ssr',
  run(ctx) {
    if (!ctx.renderedMeta?.jsonLdTypes) return []

    const ssrTypes = ctx.newMeta.jsonLdTypes ?? []
    const csrTypes = ctx.renderedMeta.jsonLdTypes

    if (ssrTypes.length > 0) return []
    if (csrTypes.length === 0) return []

    return [{
      type: 'rec_structured_data_missing_in_ssr',
      severity: 'warning',
      message: `Données structurées (${csrTypes.join(', ')}) injectées par JavaScript uniquement. Les IA (ChatGPT, Perplexity, Claude) ne les voient probablement pas — elles lisent surtout le HTML brut. Pour une meilleure visibilité IA, rendez le JSON-LD côté serveur.`,
      previousValue: null,
      currentValue: csrTypes.join(', '),
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

// rec_internal_links_audit — fire si moins de 3 liens internes dans le DOM rendu.
// Ne tourne qu'en phase CSR : les SPA chargent souvent menu/footer/sidebar par JS.
registerRule({
  id: 'rec_internal_links_audit',
  run(ctx) {
    if (ctx.renderedMeta?.internalLinkCount === undefined) return []

    const count = ctx.renderedMeta.internalLinkCount
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

// rec_internal_links_missing_in_ssr — fire si liens internes injectes par JS uniquement.
// Probleme : Google decouvre les liens via le HTML brut au premier crawl pour planifier
// les prochains crawls. Si tout est en JS, le crawl budget est mal utilise.
registerRule({
  id: 'rec_internal_links_missing_in_ssr',
  run(ctx) {
    if (ctx.renderedMeta?.internalLinkCount === undefined) return []

    const ssrCount = ctx.newMeta.internalLinkCount ?? 0
    const csrCount = ctx.renderedMeta.internalLinkCount

    if (ssrCount >= 3) return []
    if (csrCount < 3) return []

    return [{
      type: 'rec_internal_links_missing_in_ssr',
      severity: 'info',
      message: `Vos liens internes ne sont pas dans le HTML brut envoyé par votre serveur (${ssrCount} liens) mais apparaissent uniquement après chargement JavaScript (${csrCount} liens). Google découvre vos pages plus lentement car il commence par scanner le HTML brut. Solution : rendre les liens de menu, footer et navigation côté serveur (SSR).`,
      previousValue: `${ssrCount} en HTML brut`,
      currentValue: `${csrCount} après JavaScript`,
    }]
  },
})

// rec_img_alt_missing_in_ssr — fire si des images sans alt sont presentes dans le DOM
// rendu mais absentes du HTML brut. Lazy-loading sans alt = invisible pour Google
// Image Search qui lit principalement le HTML brut.
registerRule({
  id: 'rec_img_alt_missing_in_ssr',
  run(ctx) {
    if (!ctx.renderedMeta?.images) return []

    const ssrImages = ctx.newMeta.images ?? []
    const csrImages = ctx.renderedMeta.images

    // Images sans alt en CSR mais absentes du SSR (donc ajoutees par JS)
    const ssrSrcs = new Set(ssrImages.map(i => i.src))
    const newlyAddedWithoutAlt = csrImages.filter(i => !ssrSrcs.has(i.src) && !i.alt)

    if (newlyAddedWithoutAlt.length === 0) return []

    return [{
      type: 'rec_img_alt_missing_in_ssr',
      severity: 'info',
      message: `${newlyAddedWithoutAlt.length} image(s) ajoutée(s) par JavaScript n'ont pas d'attribut alt. Google Image Search ne les indexera probablement pas (il lit le HTML brut), et les utilisateurs malvoyants ne pourront pas les comprendre. Solution : ajouter un attribut alt descriptif sur chaque image, et les rendre côté serveur si possible.`,
      previousValue: null,
      currentValue: `${newlyAddedWithoutAlt.length} images JS sans alt`,
    }]
  },
})
