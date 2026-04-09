import { registerRule } from './engine'

registerRule({
  id: 'status_code_changed',
  run(ctx) {
    if (!ctx.oldStatusCode) return []
    if (ctx.newStatusCode === ctx.oldStatusCode) return []

    return [{
      type: 'status_code_changed',
      severity: ctx.newStatusCode >= 400 ? 'critical' : 'warning',
      message: `Status code: ${ctx.oldStatusCode} → ${ctx.newStatusCode}`,
      previousValue: String(ctx.oldStatusCode),
      currentValue: String(ctx.newStatusCode),
    }]
  },
})
