import { registerRule } from './engine'
import { isBenignCanonicalRedirect } from '../fetcher'
import { isInSitemap, isRedirectToWaf } from './helpers'

// Path normalisé (sans slash final). '' = racine '/'. null = URL invalide.
function pathOf(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/\/+$/, '')
  }
  catch {
    return null
  }
}

// Cible d'une redirection SIGNIFICATIVE = `ctx.newMeta.redirectTarget` (en `redirect:'manual'`,
// `finalUrl`/`response.url` ne porte PAS la destination ; les redirections canoniques bénignes ont
// déjà été suivies par le fetcher → si `redirectTarget` est présent, c'est une vraie redirection).

// Règles EVENT : ne fire qu'à la TRANSITION vers la redirection. Si la page redirigeait déjà au
// crawl précédent (oldStatusCode 3xx), re-firer recréerait une alerte neuve après chaque résolution
// utilisateur (« résolu → recrawl → l'alerte revient »). Un changement de cible seul ne re-fire pas.
function wasAlreadyRedirecting(ctx: { oldStatusCode: number | null }): boolean {
  return ctx.oldStatusCode !== null && ctx.oldStatusCode >= 300 && ctx.oldStatusCode < 400
}

// redirect_to_homepage : la page redirige vers la racine '/' → Google traite ça comme un soft 404.
registerRule({
  id: 'redirect_to_homepage',
  run(ctx) {
    const target = ctx.newMeta.redirectTarget
    if (!target) return []
    if (wasAlreadyRedirecting(ctx)) return []
    const originalPath = pathOf(ctx.pageUrl)
    if (originalPath === '' || originalPath === null) return [] // l'origine est déjà la home
    if (pathOf(target) !== '') return [] // ne fire que si la cible EST la home
    return [{
      type: 'redirect_to_homepage',
      severity: 'critical',
      message: 'Page redirects to homepage — Google treats this as a soft 404',
      previousValue: ctx.pageUrl,
      currentValue: target,
    }]
  },
})

// page_redirected : une page qui répondait 200 redirige désormais vers une AUTRE URL (cross-path).
// Cible = home → c'est redirect_to_homepage (critique, prioritaire), pas ici. Pas au 1er crawl.
registerRule({
  id: 'page_redirected',
  run(ctx) {
    if (!ctx.oldMeta) return [] // besoin d'une baseline : pas d'alerte au 1er crawl
    const target = ctx.newMeta.redirectTarget
    if (!target) return []
    if (wasAlreadyRedirecting(ctx)) return [] // déjà en redirection : pas un nouvel événement
    // Hors sitemap = migration assumée (le cas propre : 301 + retrait du sitemap) → silence.
    // Encore AU sitemap = contradiction (URL déclarée canonique qui rebondit) → alerte.
    if (!isInSitemap(ctx)) return []
    const finalPath = pathOf(target)
    if (finalPath === '' || finalPath === null) return [] // home → redirect_to_homepage
    return [{
      type: 'page_redirected',
      severity: 'warning',
      message: `Page now redirects to ${target}`,
      previousValue: ctx.pageUrl,
      currentValue: target,
    }]
  },
})

// js_redirect_detected : la page répond 200 (HTML réel) mais son JavaScript redirige le navigateur
// ailleurs (window.location, router SPA). Invisible au fetch HTTP → détecté en comparant l'URL rendue
// (CSR, page.url() après JS) à l'URL demandée. Google peut ne pas suivre, et les IA lisent le HTML 200
// (pas la destination) : machines et humains voient deux pages différentes. Phase CSR uniquement.
registerRule({
  id: 'js_redirect_detected',
  run(ctx) {
    const rendered = ctx.renderedUrl
    if (!rendered) return [] // phase SSR (pas de rendu) → rien
    // Anti-bot : si le JS nous a envoyés vers une URL de challenge (cdn-cgi, captcha…), c'est un
    // pare-feu qui bloque notre crawler, pas une vraie redirection JS → ne pas crier au loup.
    // (On teste l'URL cible, pas le contenu : isCsrBlocked <2000o ferait taire à tort une vraie redirection JS vers une petite page.)
    if (isRedirectToWaf(rendered)) return []
    // Même page si la cible ne diffère que par http/https/www/slash/casse OU une query ajoutée
    // (?utm/?ref via un script) → ce n'est PAS une redirection. On ignore donc la query (3e arg).
    if (isBenignCanonicalRedirect(ctx.pageUrl, rendered, true)) return []
    return [{
      type: 'js_redirect_detected',
      severity: 'warning',
      message: `Page redirects via JavaScript to ${rendered}`,
      previousValue: ctx.pageUrl,
      currentValue: rendered,
    }]
  },
})

// redirect_broken : une page RETIRÉE proprement (hors sitemap, redirigeait en 3xx) casse en 4xx.
// Le jus des anciens backlinks fuit en silence — typiquement un refactor qui a supprimé la règle
// de redirection ou sa cible. Les 5xx restent portés par status_code_changed (toujours actif).
registerRule({
  id: 'redirect_broken',
  run(ctx) {
    if (isInSitemap(ctx)) return [] // au sitemap → status_code_changed critical porte l'incident
    if (ctx.oldStatusCode === null || ctx.oldStatusCode < 300 || ctx.oldStatusCode >= 400) return []
    if (ctx.newStatusCode < 400 || ctx.newStatusCode >= 500) return []
    // 3xx → 410 = passage volontaire au « Gone » (retrait terminal assumé), pas une redirection
    // cassée. Seul le 4xx accidentel alerte.
    if (ctx.newStatusCode === 410) return []
    // La cible d'origine est figée ICI, à la transition — c'est l'info qui permet de réparer
    // (recréer la règle vers la bonne cible) sans fouiller son git/nginx. Au crawl suivant,
    // MonitoredPage.redirectTarget sera écrasé à null (fetch 404 sans Location) : trop tard.
    // previousValue = DONNÉE BRUTE atomique (convention page_redirected), jamais de chaîne
    // composée : le message est un snapshot d'affichage, pas un support de donnée.
    const target = ctx.oldRedirectTarget
    return [{
      type: 'redirect_broken',
      severity: 'warning',
      message: target
        ? `Redirect broken: was redirecting to ${target} (${ctx.oldStatusCode}), now returns ${ctx.newStatusCode} — link equity from old backlinks is leaking`
        : `Redirect broken: ${ctx.oldStatusCode} → ${ctx.newStatusCode} — link equity from old backlinks is leaking`,
      previousValue: target ?? String(ctx.oldStatusCode),
      currentValue: String(ctx.newStatusCode),
    }]
  },
})

// rec_redirect_temporary : page retirée (hors sitemap) qui redirige en 302/307 (temporaire).
// Google garde l'ancienne URL indexée et ne consolide pas le jus vers la cible → si le retrait
// est définitif, un 301 s'impose. Recommendation : re-fire tant que vrai, auto-résolue sinon.
registerRule({
  id: 'rec_redirect_temporary',
  run(ctx) {
    if (isInSitemap(ctx)) return []
    if (ctx.newStatusCode !== 302 && ctx.newStatusCode !== 307) return []
    return [{
      type: 'rec_redirect_temporary',
      severity: 'info',
      message: `Removed page redirects with a temporary ${ctx.newStatusCode} — use a permanent 301 to pass link equity`,
      previousValue: null,
      currentValue: String(ctx.newStatusCode),
    }]
  },
})

// rec_unclean_removal : page retirée (hors sitemap) qui renvoie un 404 nu. Le 404 fonctionne mais
// reste ambigu : Google la recrawle des semaines. Suppression définitive → 410 (désindexation plus
// rapide) ; contenu déplacé → 301 (préserve le jus). Recommendation : re-fire tant que vrai.
registerRule({
  id: 'rec_unclean_removal',
  run(ctx) {
    if (isInSitemap(ctx)) return []
    if (ctx.newStatusCode !== 404) return []
    return [{
      type: 'rec_unclean_removal',
      severity: 'info',
      message: 'Removed page returns a bare 404 — return 410 (gone for good) or 301 (moved) so Google stops recrawling it',
      previousValue: null,
      currentValue: '404',
    }]
  },
})
