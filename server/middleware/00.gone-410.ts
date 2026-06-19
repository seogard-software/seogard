// 410 Gone — articles de blog perdus lors du changement de serveur (~3 avril 2026, DB non
// sauvegardée à l'époque). Google les garde indexés et les re-crawle → on renvoie 410 « parti
// pour de bon » : désindexation propre et rapide, plus de crawl budget gaspillé. Contenu non
// récupérable (aucun backup antérieur à avril). La chaîne de backup est réparée depuis (2026-06-04).
//
// Deux mécanismes : (1) liste explicite GONE_PATHS pour les slugs perdus, (2) pattern
// `-via-sejournal-` qui couvre automatiquement toute réécriture de news Search Engine Journal
// (contenu générique anglophone, jamais publié volontairement) → plus besoin de compléter la
// liste à la main à chaque slug oublié (cause des échecs de validation GSC).
const GONE_BLOG_SLUG_PATTERN = /^\/blog\/[^/]*-via-sejournal-/
const GONE_PATHS = new Set<string>([
  '/blog/500m-ai-searches-later-how-to-actually-improve-ai-search-visibility-citations-via-sejournal-mattgsouthern',
  '/blog/ai-search-engines-cite-reddit-youtube-and-linkedin-most-study',
  '/blog/aio-citations-diverge-from-rankings-bing-rewrites-rules-seo-pulse-via-sejournal-mattgsouthern',
  '/blog/are-citations-in-ai-search-affected-by-google-organic-visibility-changes-via-sejournal-lilyraynyc',
  '/blog/bing-adds-geo-to-official-guidelines-expands-ai-abuse-definitions-via-sejournal-mattgsouthern',
  '/blog/bing-reveals-what-grounding-means-for-ai-search-visibility-via-sejournal-slobodanmanic',
  '/blog/bing-team-describes-how-grounding-differs-from-search-indexing-via-sejournal-martinibuster',
  '/blog/cloudflare-ceo-bots-could-overtake-human-web-usage-by-2027',
  '/blog/from-seo-and-cro-to-agentic-ai-optimization-aaio-why-your-website-needs-to-speak-to-machines-via-sejournal-slobodanmanic',
  '/blog/google-adds-ai-bot-labels-to-forum-q-a-structured-data-via-sejournal-mattgsouthern',
  '/blog/google-ads-adds-ai-voice-over-to-performance-max-video-ads',
  '/blog/google-ads-api-enforces-daily-minimum-budget-for-demand-gen-campaigns',
  '/blog/google-agent-user-agent-identifies-ai-agent-traffic-in-server-logs',
  '/blog/google-ai-overview-citations-from-top-ranking-pages-drop-sharply-via-sejournal-mattgsouthern',
  '/blog/google-ai-overviews-cut-germany-s-top-organic-ctr-by-59-via-sejournal-mattgsouthern',
  '/blog/google-ai-overviews-cut-search-clicks-42-report',
  '/blog/google-ai-overviews-surges-across-9-industries-via-sejournal-martinibuster',
  '/blog/google-begins-rolling-out-march-2026-core-update-via-sejournal-mattgsouthern',
  '/blog/google-confirms-ai-headline-rewrites-test-in-search-results',
  '/blog/google-patent-hints-it-could-replace-your-landing-pages-with-ai-versions',
  '/blog/google-removes-accessibility-section-from-javascript-seo-section',
  '/blog/google-says-hundreds-of-their-crawlers-are-not-documented-via-sejournal-martinibuster',
  '/blog/google-says-they-deploy-hundreds-of-undocumented-crawlers-via-sejournal-martinibuster',
  '/blog/google-tightens-rules-on-out-of-stock-product-pages',
  '/blog/google-zero-misses-the-real-problem-your-next-visitor-isn-t-human',
  '/blog/how-to-build-a-context-first-ai-search-optimization-strategy',
  '/blog/how-to-build-faqs-that-power-ai-driven-local-search',
  '/blog/how-to-keep-your-content-fresh-in-the-age-of-ai',
  '/blog/how-to-track-ai-visibility-prompts-the-right-way-via-sejournal-lorenbaker',
  '/blog/how-to-write-for-ai-search-a-playbook-for-machine-readable-content',
  '/blog/merchant-center-flags-feeds-disruption',
  '/blog/meta-is-passing-europe-s-digital-taxes-directly-to-advertisers',
  '/blog/only-15-of-pages-retrieved-by-chatgpt-appear-in-final-answers-report',
  '/blog/organic-rankings-vs-product-grids-the-new-ecommerce-divide-via-sejournal-kevin-indig',
  '/blog/own-your-branded-search-building-a-competitive-ppc-defense',
  '/blog/perplexity-s-comet-for-ios-uses-google-search-by-default',
  '/blog/prompt-research-the-next-layer-of-seo-and-geo-strategy',
  '/blog/seo-s-new-battleground-winning-the-consensus-layer',
  '/blog/the-five-infrastructure-gates-behind-crawl-render-and-index',
  '/blog/what-the-global-spanish-problem-means-for-ai-search-visibility',
  '/blog/when-the-training-data-cutoff-becomes-a-ranking-factor-via-sejournal-duaneforrester',
  '/blog/where-to-focus-technical-seo-when-you-can-t-do-it-all',
  '/blog/why-entity-authority-is-the-foundation-of-ai-search-visibility',
  '/blog/why-great-content-is-no-longer-enough-what-beats-it-in-ai-search-via-sejournal-taylerdanrw',
  '/blog/why-surface-level-seo-tactics-won-t-build-lasting-ai-search-visibility',
  '/blog/youtube-test-replaces-video-titles-with-ai-summaries',
])

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname.replace(/\/+$/, '') || '/'
  if (GONE_PATHS.has(path) || GONE_BLOG_SLUG_PATTERN.test(path)) {
    throw createError({ statusCode: 410, statusMessage: 'Gone' })
  }
})
