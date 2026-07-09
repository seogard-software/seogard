import frRules from '../../i18n/locales/fr/rules.json' with { type: 'json' }
import enRules from '../../i18n/locales/en/rules.json' with { type: 'json' }
import type { Locale } from './i18n'
import { ALERT_TYPE_LABELS, getRuleCategory } from './constants'
import { RAW_RULES } from './rules-list'

// RULES_COUNT vit dans rules-list.ts (module léger, sans rules.json) → la landing l'importe de LÀ
// pour ne pas embarquer le wording des règles. Re-exporté ici pour le serveur et les tests existants.
export { RULES_COUNT } from './rules-list'

// Catalogue officiel des règles (source unique : endpoint /api/public/rules,
// rapport de zone, docs). Le wording (label/description) est ajouté depuis rules.json.
export const RULES = RAW_RULES.map(r => ({
  ...r,
  // Wording (label + description) : i18n/locales/<locale>/rules.json — RULES = vue FR historique.
  label: ALERT_TYPE_LABELS[r.id] || r.id,
  description: (frRules.descriptions as Record<string, string>)[r.id] ?? '',
  category: getRuleCategory(r.id),
}))

/** Catalogue localisé (labels + descriptions de la locale, fallback FR). */
export function getRulesCatalog(locale: Locale): typeof RULES {
  if (locale !== 'en') return RULES
  const labels = (enRules as { labels?: Record<string, string> }).labels ?? {}
  const descriptions = (enRules as { descriptions?: Record<string, string> }).descriptions ?? {}
  return RULES.map(r => ({ ...r, label: labels[r.id] ?? r.label, description: descriptions[r.id] ?? r.description }))
}


type PriorityMeta = Record<string, { label: string, description: string }>

// Libellés des groupes de priorité : i18n/locales/<locale>/rules.json (PRIORITY_META = vue FR).
export const PRIORITY_META: PriorityMeta = frRules.priorities

export function getPriorityMeta(locale: Locale): PriorityMeta {
  return locale === 'en' ? { ...frRules.priorities, ...(enRules as { priorities?: PriorityMeta }).priorities } : frRules.priorities
}

