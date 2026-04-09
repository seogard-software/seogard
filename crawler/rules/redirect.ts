import { registerRule } from './engine'

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

registerRule({
  id: 'redirect_to_homepage',
  run(ctx) {
    if (normalizeUrl(ctx.finalUrl) === normalizeUrl(ctx.pageUrl)) return []
    try {
      const originalPath = new URL(ctx.pageUrl).pathname
      // Don't alert if the original URL is already the homepage
      if (originalPath === '/' || originalPath === '') return []
      const finalPath = new URL(ctx.finalUrl).pathname
      if (finalPath !== '/' && finalPath !== '') return []
    } catch {
      return []
    }
    return [{
      type: 'redirect_to_homepage',
      severity: 'critical',
      message: 'Page redirects to homepage — Google treats this as a soft 404',
      previousValue: ctx.pageUrl,
      currentValue: ctx.finalUrl,
    }]
  },
})
