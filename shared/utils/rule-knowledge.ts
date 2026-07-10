// Base de connaissance par règle — le CONTENU vit dans i18n/locales/<locale>/rules.json
// (extraction i18n 2026-07, traduction EN relue humainement — jamais d'IA brute publiée).
// Ce module reste l'API typée : RULE_KNOWLEDGE (vue FR historique) + getRuleKnowledge(id, locale).
// 4 blocs par règle : constat (factuel) / pourquoi (mécanique Google ET LLM) /
// action (UNE action focus) / gain (mécanique, jamais de pourcentage inventé).
// Test d'exhaustivité dans rule-knowledge.test.ts : chaque règle du catalogue a sa fiche.
import frRules from '../../i18n/locales/fr/rules.json' with { type: 'json' }
import enRules from '../../i18n/locales/en/rules.json' with { type: 'json' }
import type { Locale } from './i18n'

export interface RuleExample {
  avant: string
  apres?: string
  note?: string
}

export interface RuleFaqItem {
  q: string
  a: string
}

export interface RuleKnowledge {
  constat: string
  pourquoi: string
  action: string
  gain: string
  // ── Champs de la fiche SSR /docs/rules/[slug] (Vague 1+). Optionnels tant que la règle n'est pas
  // publiée ; obligatoires (tldr/exemple/scanHook) dès qu'elle l'est (verrouillé par le test). ──
  seoTitle?: string // <title> SERP (~55-60 car, matche l'intention de recherche) — fallback = label
  h1?: string // titre visible de la fiche (plus riche que le label court) — fallback = label
  metaDescription?: string // meta description SERP — fallback = tldr puis description catalogue
  tldr?: string // verdict citable « En bref » (front-load : le chunk que le LLM lève, le snippet Google)
  whenNotAProblem?: string[] // « Quand ce n'est PAS un problème » (nuance E-E-A-T)
  exemple?: RuleExample // code avant/après
  actionSteps?: string[] // « Comment corriger » en <ol> (le champ `action` reste la phrase focus du rapport)
  scanHook?: string // message CTA contextuel vers le scanner (variabilisé par règle)
  faq?: RuleFaqItem[] // 2-3 Q/R rendues en <h3> — PAS de FAQPage schema
}

const KNOWLEDGE_BY_LOCALE: Record<Locale, Record<string, RuleKnowledge>> = {
  fr: frRules.knowledge as Record<string, RuleKnowledge>,
  en: (enRules as { knowledge?: Record<string, RuleKnowledge> }).knowledge ?? {},
}

export const RULE_KNOWLEDGE: Record<string, RuleKnowledge> = KNOWLEDGE_BY_LOCALE.fr

export function getRuleKnowledge(ruleId: string, locale: Locale = 'fr'): RuleKnowledge | null {
  return KNOWLEDGE_BY_LOCALE[locale]?.[ruleId] ?? KNOWLEDGE_BY_LOCALE.fr[ruleId] ?? null
}

// ── Slugs des fiches /docs/rules/[slug] — traduits et FIGÉS par locale (jamais renommés sans 301).
// L'id snake_case reste la clé technique ; le slug est l'URL publique (ex : h1-manquant / missing-h1). ──
const SLUGS_BY_LOCALE: Record<Locale, Record<string, string>> = {
  fr: frRules.slugs as Record<string, string>,
  en: (enRules as { slugs?: Record<string, string> }).slugs ?? {},
}

export function getRuleSlug(ruleId: string, locale: Locale = 'fr'): string | null {
  return SLUGS_BY_LOCALE[locale]?.[ruleId] ?? SLUGS_BY_LOCALE.fr[ruleId] ?? null
}

// Résolution inverse pour la page fiche : /fr/docs/rules/<slug> → ruleId (dans la locale de l'URL).
export function getRuleIdBySlug(slug: string, locale: Locale = 'fr'): string | null {
  const map = SLUGS_BY_LOCALE[locale] ?? {}
  for (const [id, s] of Object.entries(map)) {
    if (s === slug) return id
  }
  return null
}
