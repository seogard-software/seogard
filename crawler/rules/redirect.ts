import { registerRule } from './engine'
import { isBenignCanonicalRedirect } from '../fetcher'
import { isRedirectToWaf } from './helpers'

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

// redirect_to_homepage : la page redirige vers la racine '/' → Google traite ça comme un soft 404.
registerRule({
  id: 'redirect_to_homepage',
  run(ctx) {
    const target = ctx.newMeta.redirectTarget
    if (!target) return []
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
