import { registerRule } from './engine'
import { isInSitemap } from './helpers'

registerRule({
  id: 'status_code_changed',
  run(ctx) {
    if (!ctx.oldStatusCode) return []
    if (ctx.newStatusCode === ctx.oldStatusCode) return []
    // Hors sitemap = retrait assumé par l'utilisateur → silence, SAUF 5xx (un serveur qui crashe
    // n'est jamais voulu). Le 3xx propre est silencieux, le 404 nu est repris par
    // rec_unclean_removal (conseil 410/301), la redirection qui pourrit par redirect_broken.
    if (!isInSitemap(ctx) && ctx.newStatusCode < 500) return []

    return [{
      type: 'status_code_changed',
      severity: ctx.newStatusCode >= 400 ? 'critical' : 'warning',
      message: `Status code: ${ctx.oldStatusCode} → ${ctx.newStatusCode}`,
      previousValue: String(ctx.oldStatusCode),
      currentValue: String(ctx.newStatusCode),
    }]
  },
})
