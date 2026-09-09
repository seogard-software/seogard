import { registerRule } from './engine'
import { isCsrBlocked } from './helpers'
import { isSsrError, isSsrContentMismatch, isSsrRenderingFailed } from './ssr-csr'

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
      message: `${count} image(s) missing an alt attribute`,
      previousValue: null,
      currentValue: `${count} images without alt`,
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
    const issue = len < 15 ? 'too short' : 'too long'
    return [{
      type: 'rec_title_length_audit',
      severity: 'info',
      message: `Title ${issue} (${len} characters, recommended: 15-60)`,
      previousValue: null,
      currentValue: `${len} characters`,
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
    const issue = len < 50 ? 'too short' : 'too long'
    return [{
      type: 'rec_description_length_audit',
      severity: 'info',
      message: `Meta description ${issue} (${len} characters, recommended: 50-160)`,
      previousValue: null,
      currentValue: `${len} characters`,
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
      message: 'No H1 found on the page',
      previousValue: null,
      currentValue: '0 H1',
    }]
  },
})

// SSR-vs-CSR : H1 vide en HTML brut mais rempli après JS.
// Compare la présence du H1 dans le HTML initial et le rendu, sans déduire son indexation.
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
      message: `H1 missing or empty in the raw HTML but present after JavaScript ("${csrH1Text}"). Check whether this heading should be served in the initial HTML. This difference does not establish what a search engine indexed.`,
      previousValue: null,
      currentValue: csrH1Text,
    }]
  },
})

// Seuils rec_content_missing_in_ssr — à calibrer sur des sites réels avant de figer.
// Conservateurs pour ne fire que sur des cas nets (zéro faux positif). Source unique ici.
const CONTENT_SSR_MIN_RENDERED_WORDS = 300 // en dessous : pas assez de matière pour conclure
const CONTENT_SSR_MAX_RAW_RATIO = 0.5 // < 50% du texte dans le HTML brut → signal
const CONTENT_SSR_MIN_ABS_GAP = 200 // écart absolu mini (mots) — évite le bruit de mesure SSR/CSR

// rec_content_missing_in_ssr — une part majoritaire du CORPS DE TEXTE n'apparaît qu'après JS.
// Constat de dépendance au rendu JavaScript, sans inférence sur l'indexation ou les citations IA.
// Ne couvre QUE la bande intermédiaire : le cas catastrophique (SSR quasi vide) est déjà géré
// par ssr_content_mismatch / ssr_rendering_failed → on skip pour ne JAMAIS doublonner.
registerRule({
  id: 'rec_content_missing_in_ssr',
  run(ctx) {
    if (ctx.renderedMeta?.wordCount == null) return [] // phase CSR requise
    if (isSsrError(ctx.newStatusCode)) return [] // erreur serveur → donnée non fiable
    if (isCsrBlocked(ctx.renderedMeta, ctx.csrContentLength)) return [] // anti-bot

    // Anti-doublon : le cas catastrophique est déjà couvert par les règles SSR critiques
    // (mêmes seuils — source unique dans ssr-csr.ts). On ne vit que dans la bande intermédiaire.
    if (isSsrContentMismatch(ctx.ssrContentLength, ctx.csrContentLength)) return []
    if (isSsrRenderingFailed(ctx.ssrContentLength, ctx.csrContentLength)) return []

    const csr = ctx.renderedMeta.wordCount
    const ssr = ctx.newMeta.wordCount
    if (csr < CONTENT_SSR_MIN_RENDERED_WORDS) return [] // pas assez de matière
    if (ssr >= csr) return [] // le brut a autant/plus → rien à signaler
    if (csr - ssr < CONTENT_SSR_MIN_ABS_GAP) return [] // écart absolu trop faible
    if (ssr / csr >= CONTENT_SSR_MAX_RAW_RATIO) return [] // l'essentiel du texte est déjà dans le HTML brut

    const missing = csr - ssr
    return [{
      type: 'rec_content_missing_in_ssr',
      severity: 'warning',
      message: `${missing} of ${csr} words only appear after JavaScript execution. Check whether the main content should also be present in the server HTML. This comparison does not establish search indexing or AI citations.`,
      previousValue: null,
      currentValue: `SSR ${ssr} words / CSR ${csr} words`,
    }]
  },
})

// rec_title_missing_in_ssr — le <title> est absent du HTML brut mais injecté par JavaScript.
// Anti-doublon : si le titre EXISTAIT au crawl précédent (oldMeta.title), sa disparition du
// HTML brut est déjà une régression couverte par meta_title_missing (critical + email) → on
// laisse ce chemin la traiter. La reco ne couvre que le cas STRUCTUREL (titre jamais présent
// dans le HTML brut, uniquement injecté côté JS).
registerRule({
  id: 'rec_title_missing_in_ssr',
  run(ctx) {
    if (!ctx.renderedMeta) return [] // phase CSR requise
    if (isSsrError(ctx.newStatusCode)) return [] // erreur serveur → donnée non fiable
    if (isCsrBlocked(ctx.renderedMeta, ctx.csrContentLength)) return [] // anti-bot
    if (ctx.oldMeta?.title) return [] // disparition = régression (meta_title_missing), pas une reco
    if (ctx.newMeta.title) return [] // présent dans le HTML brut → rien à signaler
    const csrTitle = ctx.renderedMeta.title
    if (!csrTitle) return [] // absent aussi en CSR → ni l'un ni l'autre, hors scope
    return [{
      type: 'rec_title_missing_in_ssr',
      severity: 'warning',
      message: `The <title> is missing from raw HTML but present after JavaScript ("${csrTitle}"). Render it server-side to make it available without JavaScript execution. This check does not establish the title used in search results.`,
      previousValue: null,
      currentValue: csrTitle,
    }]
  },
})

// rec_description_missing_in_ssr — meta description injectée par JavaScript uniquement.
// Même garde-fou anti-doublon que ci-dessus (meta_description_missing gère la régression).
registerRule({
  id: 'rec_description_missing_in_ssr',
  run(ctx) {
    if (!ctx.renderedMeta) return [] // phase CSR requise
    if (isSsrError(ctx.newStatusCode)) return [] // erreur serveur → donnée non fiable
    if (isCsrBlocked(ctx.renderedMeta, ctx.csrContentLength)) return [] // anti-bot
    if (ctx.oldMeta?.description) return [] // disparition = régression (meta_description_missing)
    if (ctx.newMeta.description) return [] // présente dans le HTML brut → rien à signaler
    const csrDescription = ctx.renderedMeta.description
    if (!csrDescription) return [] // absente aussi en CSR → hors scope
    return [{
      type: 'rec_description_missing_in_ssr',
      severity: 'info',
      message: 'The meta description is missing from raw HTML but present after JavaScript. Render it server-side to make it available in the initial HTML. Search engines may choose a different snippet.',
      previousValue: null,
      currentValue: csrDescription,
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
      message: 'No favicon detected',
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
      message: `Missing semantic tags: ${missing.join(', ')}`,
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
      message: `Semantic tags (${missingInSsr.join(', ')}) missing from the raw HTML sent by your server — they only appear after JavaScript loads. Google and screen readers (accessibility) understand your page structure better when these tags are present in the first render. Fix: structure your layout with these tags server-side.`,
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
      message: 'No JSON-LD structured data detected',
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
      message: `Structured data (${csrTypes.join(', ')}) is present after JavaScript but absent from raw HTML. Consider serving JSON-LD in the initial HTML to remove this rendering dependency. This check does not measure rich results or AI citations.`,
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
      message: `Missing Open Graph tags: ${missing.join(', ')}`,
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
      message: `Only ${count} internal link(s) (recommended: >= 3)`,
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
      message: `Internal link counts differ between raw HTML (${ssrCount}) and JavaScript rendering (${csrCount}). Check that important navigation links are available in the initial HTML. This check does not measure Google crawl timing.`,
      previousValue: `${ssrCount} in raw HTML`,
      currentValue: `${csrCount} after JavaScript`,
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
      message: `${newlyAddedWithoutAlt.length} image(s) added by JavaScript have no alt attribute. Add a meaningful text alternative for informative images, or an empty alt for decorative images. This check does not establish image indexing.`,
      previousValue: null,
      currentValue: `${newlyAddedWithoutAlt.length} JS images without alt`,
    }]
  },
})
