import { registerRule } from './engine'

registerRule({
  id: 'structured_data_removed',
  run(ctx) {
    if (!ctx.oldMeta) return []
    const oldTypes = ctx.oldMeta.jsonLdTypes ?? []
    const newTypes = ctx.newMeta.jsonLdTypes ?? []
    if (oldTypes.length === 0) return []
    const removed = oldTypes.filter(t => !newTypes.includes(t))
    if (removed.length === 0) return []
    return [{
      type: 'structured_data_removed',
      severity: 'warning',
      message: `Structured data removed: ${removed.join(', ')}`,
      previousValue: oldTypes.join(', '),
      currentValue: newTypes.length > 0 ? newTypes.join(', ') : null,
    }]
  },
})

registerRule({
  id: 'structured_data_error',
  run(ctx) {
    if (ctx.newMeta.jsonLdValid !== false) return []
    return [{
      type: 'structured_data_error',
      severity: 'warning',
      message: 'JSON-LD structured data contains invalid JSON',
      previousValue: null,
      currentValue: 'invalid JSON-LD',
    }]
  },
})
