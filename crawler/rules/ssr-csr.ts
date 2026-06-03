import { registerRule } from './engine'
import { isCsrBlocked, normalizeForCompare } from './helpers'

// Seuils SSR/CSR (en octets) — SOURCE UNIQUE. Réutilisés par les règles critiques ci-dessous
// ET par les gardes anti-doublon des recommandations (rec_content_missing_in_ssr). Changer
// une valeur ici la change PARTOUT.
export const SSR_CONTENT_MISMATCH_MAX_RATIO = 0.1
export const SSR_RENDERING_FAILED_SSR_MAX_BYTES = 200
export const SSR_RENDERING_FAILED_CSR_MIN_BYTES = 1000

/** SSR returned an error page — comparison with CSR is meaningless */
export function isSsrError(statusCode: number): boolean {
  return statusCode >= 400
}

/** HTML brut < ratio seuil du rendu → SSR cassé (cas catastrophique, critical). */
export function isSsrContentMismatch(ssrBytes: number, csrBytes: number | null): boolean {
  if (!ssrBytes || !csrBytes) return false
  return ssrBytes / csrBytes < SSR_CONTENT_MISMATCH_MAX_RATIO
}

/** HTML brut quasi vide alors que le rendu JS est conséquent → rendu SSR échoué (critical). */
export function isSsrRenderingFailed(ssrBytes: number, csrBytes: number | null): boolean {
  return !!csrBytes && ssrBytes < SSR_RENDERING_FAILED_SSR_MAX_BYTES && csrBytes > SSR_RENDERING_FAILED_CSR_MIN_BYTES
}

registerRule({
  id: 'ssr_content_mismatch',
  run(ctx) {
    if (isSsrError(ctx.newStatusCode)) return []
    if (isCsrBlocked(ctx.renderedMeta, ctx.csrContentLength)) return []
    if (!ctx.csrContentLength || !ctx.ssrContentLength) return []

    const ratio = ctx.ssrContentLength / ctx.csrContentLength
    if (ratio >= SSR_CONTENT_MISMATCH_MAX_RATIO) return []
    return [{
      type: 'ssr_content_mismatch',
      severity: 'critical',
      message: `SSR content is ${Math.round(ratio * 100)}% of CSR — possible SSR failure`,
      previousValue: null,
      currentValue: `SSR: ${ctx.ssrContentLength}b, CSR: ${ctx.csrContentLength}b`,
    }]
  },
})

registerRule({
  id: 'ssr_rendering_failed',
  run(ctx) {
    if (isSsrError(ctx.newStatusCode)) return []
    if (isCsrBlocked(ctx.renderedMeta, ctx.csrContentLength)) return []
    if (!isSsrRenderingFailed(ctx.ssrContentLength, ctx.csrContentLength)) return []

    return [{
      type: 'ssr_rendering_failed',
      severity: 'critical',
      message: `SSR rendering broken — ${ctx.ssrContentLength}b SSR vs ${ctx.csrContentLength}b CSR`,
      previousValue: null,
      currentValue: `SSR: ${ctx.ssrContentLength}b, CSR: ${ctx.csrContentLength}b`,
    }]
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
