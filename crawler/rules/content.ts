import { registerRule } from './engine'

registerRule({
  id: 'soft_404',
  run(ctx) {
    if (!ctx.newMeta.isSoft404) return []
    return [{
      type: 'soft_404',
      severity: 'critical',
      message: 'Soft 404 — page returns 200 but content looks like a "not found" page',
      previousValue: null,
      currentValue: ctx.newMeta.title,
    }]
  },
})

registerRule({
  id: 'thin_content',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (ctx.oldMeta.wordCount === undefined) return []
    const oldWords = ctx.oldMeta.wordCount ?? 0
    const newWords = ctx.newMeta.wordCount ?? 0
    if (newWords >= 200) return []
    if (oldWords < 200) return [] // was already thin
    return [{
      type: 'thin_content',
      severity: 'warning',
      message: `Content is thin (${newWords} words, was ${oldWords})`,
      previousValue: `${oldWords} words`,
      currentValue: `${newWords} words`,
    }]
  },
})

registerRule({
  id: 'content_removed',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (ctx.oldMeta.wordCount === undefined) return []
    const oldWords = ctx.oldMeta.wordCount ?? 0
    const newWords = ctx.newMeta.wordCount ?? 0
    if (oldWords < 100) return [] // too small to be meaningful
    const ratio = newWords / oldWords
    if (ratio >= 0.5) return [] // less than 50% drop
    return [{
      type: 'content_removed',
      severity: 'critical',
      message: `Content dropped ${Math.round((1 - ratio) * 100)}% (${oldWords} → ${newWords} words)`,
      previousValue: `${oldWords} words`,
      currentValue: `${newWords} words`,
    }]
  },
})

registerRule({
  id: 'word_count_changed',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (ctx.oldMeta.wordCount === undefined) return []
    const oldWords = ctx.oldMeta.wordCount ?? 0
    const newWords = ctx.newMeta.wordCount ?? 0
    if (oldWords < 100) return []
    const ratio = newWords / oldWords
    // Only significant changes (>30% either way), not covered by content_removed
    if (ratio < 0.5 || ratio > 1.5 || (ratio >= 0.7 && ratio <= 1.3)) return []
    return [{
      type: 'word_count_changed',
      severity: 'info',
      message: `Word count changed significantly (${oldWords} → ${newWords})`,
      previousValue: `${oldWords} words`,
      currentValue: `${newWords} words`,
    }]
  },
})
