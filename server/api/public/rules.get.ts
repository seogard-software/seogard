import { getRulesCatalog, getPriorityMeta, RULES } from '../../../shared/utils/rules-catalog'
import { isLocale, DEFAULT_LOCALE } from '../../../shared/utils/i18n'

export default defineEventHandler((event) => {
  // Catalogue localisé : ?locale=en sert labels/descriptions/groupes EN (fallback FR).
  const rawLocale = getQuery(event).locale
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE
  const rules = getRulesCatalog(locale)
  const priorityMeta = getPriorityMeta(locale)

  const groups: Record<string, { label: string, description: string, rules: typeof RULES }> = {}
  for (const rule of rules) {
    let group = groups[rule.priority]
    if (!group) {
      const meta = priorityMeta[rule.priority] ?? { label: rule.priority, description: '' }
      group = { ...meta, rules: [] }
      groups[rule.priority] = group
    }
    group.rules.push(rule)
  }

  return {
    total: rules.length,
    monitoring: rules.filter(r => !r.priority.includes('REC')).length,
    recommendations: rules.filter(r => r.priority.includes('REC')).length,
    groups,
  }
})
