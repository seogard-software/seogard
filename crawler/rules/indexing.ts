import { registerRule } from './engine'

registerRule({
  id: 'noindex_added',
  run(ctx) {
    if (!ctx.oldMeta) return []
    const oldHasNoindex = ctx.oldMeta.robots?.includes('noindex') ?? false
    const newHasNoindex = ctx.newMeta.robots?.includes('noindex') ?? false

    if (newHasNoindex && !oldHasNoindex) {
      return [{
        type: 'noindex_added',
        severity: 'critical',
        message: 'noindex added — page will be deindexed',
        previousValue: ctx.oldMeta.robots,
        currentValue: ctx.newMeta.robots,
      }]
    }
    return []
  },
})

registerRule({
  id: 'robots_txt_changed',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (ctx.newMeta.robots === ctx.oldMeta.robots) return []

    const newHasNoindex = ctx.newMeta.robots?.includes('noindex') ?? false
    if (newHasNoindex) return [] // handled by noindex_added

    return [{
      type: 'robots_txt_changed',
      severity: 'warning',
      message: 'Robots meta tag changed',
      previousValue: ctx.oldMeta.robots,
      currentValue: ctx.newMeta.robots,
    }]
  },
})
