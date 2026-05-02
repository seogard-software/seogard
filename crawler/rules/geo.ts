import { registerRule } from './engine'

// Site-level rules should only fire once per crawl.
// We use the homepage (root URL) as the anchor — skip non-root pages.
function isSiteRoot(pageUrl: string): boolean {
  try {
    const url = new URL(pageUrl)
    return url.pathname === '/' || url.pathname === ''
  }
  catch {
    return false
  }
}

// ─── Recommendation rules (audit) ───────────────────────────────

registerRule({
  id: 'rec_llms_txt_missing',
  run(ctx) {
    if (!ctx.siteContext) return []
    if (!isSiteRoot(ctx.pageUrl)) return []
    if (ctx.siteContext.hasLlmsTxt) return []
    return [{
      type: 'rec_llms_txt_missing',
      severity: 'info',
      message: 'Aucun /llms.txt détecté — les LLM (ChatGPT, Claude, Perplexity) ne peuvent pas comprendre votre site',
      previousValue: null,
      currentValue: null,
    }]
  },
})

registerRule({
  id: 'rec_ai_crawlers_blocked',
  run(ctx) {
    if (!ctx.siteContext) return []
    if (!isSiteRoot(ctx.pageUrl)) return []
    if (ctx.siteContext.aiCrawlersBlocked.length === 0) return []
    const blocked = ctx.siteContext.aiCrawlersBlocked.join(', ')
    return [{
      type: 'rec_ai_crawlers_blocked',
      severity: 'warning',
      message: `robots.txt bloque des crawlers IA : ${blocked}`,
      previousValue: null,
      currentValue: blocked,
    }]
  },
})

// rec_structured_data_incomplete — JSON-LD present mais incomplet (auteur/date/publisher).
// Migre sur le DOM rende (CSR) car le JSON-LD est souvent injecte par JS (CMS modernes).
registerRule({
  id: 'rec_structured_data_incomplete',
  run(ctx) {
    if (!ctx.renderedMeta?.jsonLdTypes) return []
    if (ctx.renderedMeta.jsonLdTypes.length === 0) return [] // no JSON-LD at all (handled by rec_structured_data_missing_audit)

    const missing: string[] = []
    if (!ctx.renderedMeta.jsonLdAuthor) missing.push('author')
    if (!ctx.renderedMeta.jsonLdDatePublished) missing.push('datePublished')
    if (!ctx.renderedMeta.jsonLdPublisher) missing.push('publisher')
    if (missing.length === 0) return []
    return [{
      type: 'rec_structured_data_incomplete',
      severity: 'info',
      message: `Données structurées incomplètes : ${missing.join(', ')} manquant(s) — réduit la crédibilité pour les moteurs IA`,
      previousValue: null,
      currentValue: missing.join(', '),
    }]
  },
})

// rec_faq_schema_missing — FAQPage schema absent sur les pages de contenu.
// Migre sur le DOM rende.
registerRule({
  id: 'rec_faq_schema_missing',
  run(ctx) {
    if (ctx.renderedMeta?.hasFaqSchema === undefined) return []
    if (ctx.renderedMeta.hasFaqSchema) return []
    // Only suggest FAQ schema if the page has enough content
    const wc = ctx.renderedMeta.wordCount ?? ctx.newMeta.wordCount
    if (wc < 300) return []
    return [{
      type: 'rec_faq_schema_missing',
      severity: 'info',
      message: 'Aucun schema FAQPage — les FAQ sont reprises dans les AI Overviews et les featured snippets',
      previousValue: null,
      currentValue: null,
    }]
  },
})

// rec_citation_signals_missing — signaux de citation (auteur/date/sources) faibles.
// Migre sur le DOM rende.
registerRule({
  id: 'rec_citation_signals_missing',
  run(ctx) {
    if (!ctx.renderedMeta?.jsonLdTypes) return []
    // Only relevant for content pages (enough text)
    const wc = ctx.renderedMeta.wordCount ?? ctx.newMeta.wordCount
    if (wc < 300) return []
    const signals: string[] = []
    if (!ctx.renderedMeta.jsonLdAuthor) signals.push('auteur')
    if (!ctx.renderedMeta.jsonLdDatePublished) signals.push('date de publication')
    if ((ctx.renderedMeta.externalLinkCount ?? 0) === 0) signals.push('sources externes')
    if (signals.length < 2) return [] // at least 2 missing to alert
    return [{
      type: 'rec_citation_signals_missing',
      severity: 'info',
      message: `Signaux de citation faibles : ${signals.join(', ')} absent(s) — les LLM citent moins les contenus sans autorité`,
      previousValue: null,
      currentValue: signals.join(', '),
    }]
  },
})

// rec_content_structure_audit — structure du contenu (H2, listes) peu adaptee aux IA.
// Migre sur le DOM rende.
registerRule({
  id: 'rec_content_structure_audit',
  run(ctx) {
    if (!ctx.renderedMeta?.headings) return []
    const wc = ctx.renderedMeta.wordCount ?? ctx.newMeta.wordCount
    if (wc < 300) return []
    const issues: string[] = []
    const h2Count = ctx.renderedMeta.headings.filter(h => h.level === 2).length
    if (h2Count === 0) issues.push('pas de H2')
    if (!ctx.renderedMeta.hasLists) issues.push('pas de listes (ul/ol)')
    if (issues.length === 0) return []
    return [{
      type: 'rec_content_structure_audit',
      severity: 'info',
      message: `Structure de contenu peu adaptée aux IA : ${issues.join(', ')} — les LLM extraient mieux les réponses d'un contenu structuré`,
      previousValue: null,
      currentValue: issues.join(', '),
    }]
  },
})

// ─── Event rules (monitoring/regression) ─────────────────────────

registerRule({
  id: 'llms_txt_removed',
  run(ctx) {
    if (!ctx.siteContext) return []
    if (!isSiteRoot(ctx.pageUrl)) return []
    if (ctx.siteContext.oldHasLlmsTxt === undefined) return [] // no previous data
    if (!ctx.siteContext.oldHasLlmsTxt) return [] // wasn't there before
    if (ctx.siteContext.hasLlmsTxt) return [] // still there
    return [{
      type: 'llms_txt_removed',
      severity: 'critical',
      message: '/llms.txt supprimé — le site perd sa visibilité pour les LLM (ChatGPT, Claude, Perplexity)',
      previousValue: '/llms.txt présent',
      currentValue: null,
    }]
  },
})

registerRule({
  id: 'ai_crawlers_blocked_changed',
  run(ctx) {
    if (!ctx.siteContext) return []
    if (!isSiteRoot(ctx.pageUrl)) return []
    if (!ctx.siteContext.oldAiCrawlersBlocked) return [] // no previous data
    const oldBlocked = ctx.siteContext.oldAiCrawlersBlocked
    const newBlocked = ctx.siteContext.aiCrawlersBlocked
    // Detect newly blocked crawlers (not previously blocked)
    const newlyBlocked = newBlocked.filter(b => !oldBlocked.includes(b))
    if (newlyBlocked.length === 0) return []
    return [{
      type: 'ai_crawlers_blocked_changed',
      severity: 'warning',
      message: `Nouveaux crawlers IA bloqués dans robots.txt : ${newlyBlocked.join(', ')}`,
      previousValue: oldBlocked.length > 0 ? oldBlocked.join(', ') : 'aucun bloqué',
      currentValue: newBlocked.join(', '),
    }]
  },
})

registerRule({
  id: 'faq_schema_removed',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (!ctx.oldMeta.hasFaqSchema) return [] // wasn't there
    if (ctx.newMeta.hasFaqSchema) return [] // still there
    return [{
      type: 'faq_schema_removed',
      severity: 'warning',
      message: 'Schema FAQPage supprimé — perte potentielle de featured snippets et de visibilité AI Overviews',
      previousValue: 'FAQPage présent',
      currentValue: null,
    }]
  },
})

registerRule({
  id: 'structured_data_author_removed',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (!ctx.oldMeta.jsonLdAuthor) return [] // wasn't there
    if (ctx.newMeta.jsonLdAuthor) return [] // still there
    return [{
      type: 'structured_data_author_removed',
      severity: 'critical',
      message: `Auteur supprimé des données structurées (était : ${ctx.oldMeta.jsonLdAuthor}) — réduit la crédibilité pour les IA`,
      previousValue: ctx.oldMeta.jsonLdAuthor,
      currentValue: null,
    }]
  },
})
