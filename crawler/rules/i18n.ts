import { registerRule } from './engine'

registerRule({
  id: 'hreflang_removed',
  run(ctx) {
    if (!ctx.oldMeta) return []
    const oldHreflangs = ctx.oldMeta.hreflangs ?? []
    const newHreflangs = ctx.newMeta.hreflangs ?? []
    if (oldHreflangs.length === 0) return []
    if (newHreflangs.length > 0) return [] // still has hreflangs
    return [{
      type: 'hreflang_removed',
      severity: 'critical',
      message: `All hreflang tags removed (had ${oldHreflangs.length} languages)`,
      previousValue: oldHreflangs.map(h => h.lang).join(', '),
      currentValue: null,
    }]
  },
})

registerRule({
  id: 'hreflang_changed',
  run(ctx) {
    if (!ctx.oldMeta) return []
    const oldHreflangs = ctx.oldMeta.hreflangs ?? []
    const newHreflangs = ctx.newMeta.hreflangs ?? []
    if (oldHreflangs.length === 0 || newHreflangs.length === 0) return []
    const oldLangs = oldHreflangs.map(h => h.lang).sort().join(',')
    const newLangs = newHreflangs.map(h => h.lang).sort().join(',')
    if (oldLangs === newLangs) return []
    return [{
      type: 'hreflang_changed',
      severity: 'warning',
      message: 'Hreflang language mapping changed',
      previousValue: oldHreflangs.map(h => h.lang).join(', '),
      currentValue: newHreflangs.map(h => h.lang).join(', '),
    }]
  },
})

registerRule({
  id: 'lang_attribute_missing',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (!ctx.oldMeta.lang) return []
    if (ctx.newMeta.lang) return []
    return [{
      type: 'lang_attribute_missing',
      severity: 'warning',
      message: 'HTML lang attribute removed — Google may misidentify the page language',
      previousValue: ctx.oldMeta.lang,
      currentValue: null,
    }]
  },
})

registerRule({
  id: 'lang_attribute_changed',
  run(ctx) {
    if (!ctx.oldMeta?.lang || !ctx.newMeta.lang) return []
    if (ctx.oldMeta.lang === ctx.newMeta.lang) return []
    return [{
      type: 'lang_attribute_changed',
      severity: 'warning',
      message: `HTML lang changed: ${ctx.oldMeta.lang} → ${ctx.newMeta.lang}`,
      previousValue: ctx.oldMeta.lang,
      currentValue: ctx.newMeta.lang,
    }]
  },
})
