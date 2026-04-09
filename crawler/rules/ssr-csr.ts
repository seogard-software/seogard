import { registerRule } from './engine'
import { isCsrBlocked, normalizeForCompare } from './helpers'

/** SSR returned an error page — comparison with CSR is meaningless */
function isSsrError(statusCode: number): boolean {
  return statusCode >= 400
}

registerRule({
  id: 'ssr_content_mismatch',
  run(ctx) {
    if (isSsrError(ctx.newStatusCode)) return []
    if (isCsrBlocked(ctx.renderedMeta, ctx.csrContentLength)) return []
    if (!ctx.csrContentLength || !ctx.ssrContentLength) return []

    const ratio = ctx.ssrContentLength / ctx.csrContentLength
    if (ratio < 0.1) {
      return [{
        type: 'ssr_content_mismatch',
        severity: 'critical',
        message: `SSR content is ${Math.round(ratio * 100)}% of CSR — possible SSR failure`,
        previousValue: null,
        currentValue: `SSR: ${ctx.ssrContentLength}b, CSR: ${ctx.csrContentLength}b`,
      }]
    }
    return []
  },
})

registerRule({
  id: 'ssr_rendering_failed',
  run(ctx) {
    if (isSsrError(ctx.newStatusCode)) return []
    if (isCsrBlocked(ctx.renderedMeta, ctx.csrContentLength)) return []
    if (!ctx.csrContentLength) return []

    if (ctx.ssrContentLength < 200 && ctx.csrContentLength > 1000) {
      return [{
        type: 'ssr_rendering_failed',
        severity: 'critical',
        message: `SSR rendering broken — ${ctx.ssrContentLength}b SSR vs ${ctx.csrContentLength}b CSR`,
        previousValue: null,
        currentValue: `SSR: ${ctx.ssrContentLength}b, CSR: ${ctx.csrContentLength}b`,
      }]
    }
    return []
  },
})

registerRule({
  id: 'ssr_title_mismatch',
  run(ctx) {
    if (isSsrError(ctx.newStatusCode)) return []
    if (isCsrBlocked(ctx.renderedMeta, ctx.csrContentLength)) return []
    if (!ctx.renderedMeta?.title || !ctx.newMeta.title) return []

    if (normalizeForCompare(ctx.newMeta.title) !== normalizeForCompare(ctx.renderedMeta.title)) {
      return [{
        type: 'ssr_title_mismatch',
        severity: 'warning',
        message: 'SSR title differs from CSR title',
        previousValue: `SSR: ${ctx.newMeta.title}`,
        currentValue: `CSR: ${ctx.renderedMeta.title}`,
      }]
    }
    return []
  },
})

registerRule({
  id: 'ssr_meta_description_mismatch',
  run(ctx) {
    if (isSsrError(ctx.newStatusCode)) return []
    if (isCsrBlocked(ctx.renderedMeta, ctx.csrContentLength)) return []
    if (!ctx.renderedMeta?.description || !ctx.newMeta.description) return []

    if (normalizeForCompare(ctx.newMeta.description) !== normalizeForCompare(ctx.renderedMeta.description)) {
      return [{
        type: 'ssr_meta_description_mismatch',
        severity: 'warning',
        message: 'SSR meta description differs from CSR',
        previousValue: `SSR: ${ctx.newMeta.description}`,
        currentValue: `CSR: ${ctx.renderedMeta.description}`,
      }]
    }
    return []
  },
})
