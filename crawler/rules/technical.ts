import type { PageMeta } from '../fetcher'
import { registerRule } from './engine'

function getImgWithoutAltCount(meta: PageMeta | null): number {
  return meta?.images?.filter(i => !i.alt).length ?? 0
}

registerRule({
  id: 'viewport_missing',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (!ctx.oldMeta.viewport) return [] // was already missing
    if (ctx.newMeta.viewport) return [] // still present
    return [{
      type: 'viewport_missing',
      severity: 'critical',
      message: 'Viewport meta tag removed — page is no longer mobile-friendly',
      previousValue: ctx.oldMeta.viewport,
      currentValue: null,
    }]
  },
})

registerRule({
  id: 'charset_missing',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (!ctx.oldMeta.charset) return []
    if (ctx.newMeta.charset) return []
    return [{
      type: 'charset_missing',
      severity: 'warning',
      message: 'Charset declaration removed — may cause encoding issues',
      previousValue: ctx.oldMeta.charset,
      currentValue: null,
    }]
  },
})

registerRule({
  id: 'meta_refresh_detected',
  run(ctx) {
    if (!ctx.newMeta.hasMetaRefresh) return []
    return [{
      type: 'meta_refresh_detected',
      severity: 'warning',
      message: 'Meta refresh redirect detected — use HTTP 301 redirect instead',
      previousValue: null,
      currentValue: 'meta http-equiv="refresh"',
    }]
  },
})

registerRule({
  id: 'https_mixed_content',
  run(ctx) {
    if (!ctx.newMeta.hasMixedContent) return []
    return [{
      type: 'https_mixed_content',
      severity: 'warning',
      message: 'Des images, scripts ou styles sont chargés en HTTP sur une page HTTPS. Le cadenas de sécurité disparaît et les navigateurs peuvent bloquer ces ressources.',
      previousValue: null,
      currentValue: 'Ressources HTTP détectées sur page HTTPS',
    }]
  },
})

// img_alt_missing DISABLED — redundant with rec_img_alt_audit (recommendation).
// The audit rule checks the absolute state at each crawl.
