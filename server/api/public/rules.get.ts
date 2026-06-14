import { RULES, PRIORITY_META } from '../../../shared/utils/rules-catalog'

export default defineEventHandler(() => {
  const groups: Record<string, { label: string; description: string; rules: typeof RULES }> = {}
  for (const rule of RULES) {
    let group = groups[rule.priority]
    if (!group) {
      const meta = PRIORITY_META[rule.priority] ?? { label: rule.priority, description: '' }
      group = { ...meta, rules: [] }
      groups[rule.priority] = group
    }
    group.rules.push(rule)
  }

  return {
    total: RULES.length,
    monitoring: RULES.filter(r => !r.priority.includes('REC')).length,
    recommendations: RULES.filter(r => r.priority.includes('REC')).length,
    groups,
  }
})
