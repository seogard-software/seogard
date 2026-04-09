import { registerRule } from './engine'

registerRule({
  id: 'og_image_removed',
  run(ctx) {
    if (!ctx.oldMeta?.ogImage) return []
    if (ctx.newMeta.ogImage) return []
    return [{
      type: 'og_image_removed',
      severity: 'warning',
      message: 'og:image removed — no image in social shares / Google Discover',
      previousValue: ctx.oldMeta.ogImage,
      currentValue: null,
    }]
  },
})

registerRule({
  id: 'og_title_removed',
  run(ctx) {
    if (!ctx.oldMeta?.ogTitle) return []
    if (ctx.newMeta.ogTitle) return []
    return [{
      type: 'og_title_removed',
      severity: 'warning',
      message: 'og:title removed — social share title may degrade',
      previousValue: ctx.oldMeta.ogTitle,
      currentValue: null,
    }]
  },
})
