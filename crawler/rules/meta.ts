import { registerRule } from './engine'
import { truncate } from './helpers'

registerRule({
  id: 'meta_title_missing',
  run(ctx) {
    if (!ctx.oldMeta?.title) return []
    if (!ctx.newMeta.title) {
      return [{
        type: 'meta_title_missing',
        severity: 'critical',
        message: `Meta title removed (was: "${truncate(ctx.oldMeta.title)}")`,
        previousValue: ctx.oldMeta.title,
        currentValue: null,
      }]
    }
    return []
  },
})

registerRule({
  id: 'meta_title_changed',
  run(ctx) {
    if (!ctx.oldMeta?.title || !ctx.newMeta.title) return []
    if (ctx.newMeta.title !== ctx.oldMeta.title) {
      return [{
        type: 'meta_title_changed',
        severity: 'warning',
        message: 'Meta title changed',
        previousValue: ctx.oldMeta.title,
        currentValue: ctx.newMeta.title,
      }]
    }
    return []
  },
})

registerRule({
  id: 'meta_description_missing',
  run(ctx) {
    if (!ctx.oldMeta?.description) return []
    if (!ctx.newMeta.description) {
      return [{
        type: 'meta_description_missing',
        severity: 'critical',
        message: `Meta description removed (was: "${truncate(ctx.oldMeta.description)}")`,
        previousValue: ctx.oldMeta.description,
        currentValue: null,
      }]
    }
    return []
  },
})

registerRule({
  id: 'meta_description_changed',
  run(ctx) {
    if (!ctx.oldMeta?.description || !ctx.newMeta.description) return []
    if (ctx.newMeta.description !== ctx.oldMeta.description) {
      return [{
        type: 'meta_description_changed',
        severity: 'info',
        message: 'Meta description changed',
        previousValue: ctx.oldMeta.description,
        currentValue: ctx.newMeta.description,
      }]
    }
    return []
  },
})

registerRule({
  id: 'canonical_missing',
  run(ctx) {
    if (!ctx.oldMeta?.canonical) return []
    if (!ctx.newMeta.canonical) {
      return [{
        type: 'canonical_missing',
        severity: 'critical',
        message: `Canonical tag removed (was: ${ctx.oldMeta.canonical})`,
        previousValue: ctx.oldMeta.canonical,
        currentValue: null,
      }]
    }
    return []
  },
})

registerRule({
  id: 'canonical_changed',
  run(ctx) {
    if (!ctx.oldMeta?.canonical) return []
    if (!ctx.newMeta.canonical || ctx.newMeta.canonical === ctx.oldMeta.canonical) return []
    return [{
      type: 'canonical_changed',
      severity: 'warning',
      message: 'Canonical tag changed',
      previousValue: ctx.oldMeta.canonical,
      currentValue: ctx.newMeta.canonical,
    }]
  },
})

// --- Length rules DISABLED ---
// title_too_long, title_too_short, description_too_long, description_too_short
// Redundant with rec_title_length_audit and rec_description_length_audit (recommendations).
// The audit rules check the absolute state at each crawl — no need for event-based regression alerts.
