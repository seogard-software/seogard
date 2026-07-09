// Base de connaissance par règle — le CONTENU vit dans i18n/locales/<locale>/rules.json
// (extraction i18n 2026-07, traduction EN relue humainement — jamais d'IA brute publiée).
// Ce module reste l'API typée : RULE_KNOWLEDGE (vue FR historique) + getRuleKnowledge(id, locale).
// 4 blocs par règle : constat (factuel) / pourquoi (mécanique Google ET LLM) /
// action (UNE action focus) / gain (mécanique, jamais de pourcentage inventé).
// Test d'exhaustivité dans rule-knowledge.test.ts : chaque règle du catalogue a sa fiche.
import frRules from '../../i18n/locales/fr/rules.json' with { type: 'json' }
import enRules from '../../i18n/locales/en/rules.json' with { type: 'json' }
import type { Locale } from './i18n'

export interface RuleKnowledge {
  constat: string
  pourquoi: string
  action: string
  gain: string
}

const KNOWLEDGE_BY_LOCALE: Record<Locale, Record<string, RuleKnowledge>> = {
  fr: frRules.knowledge as Record<string, RuleKnowledge>,
  en: (enRules as { knowledge?: Record<string, RuleKnowledge> }).knowledge ?? {},
}

export const RULE_KNOWLEDGE: Record<string, RuleKnowledge> = KNOWLEDGE_BY_LOCALE.fr

export function getRuleKnowledge(ruleId: string, locale: Locale = 'fr'): RuleKnowledge | null {
  return KNOWLEDGE_BY_LOCALE[locale]?.[ruleId] ?? KNOWLEDGE_BY_LOCALE.fr[ruleId] ?? null
}
