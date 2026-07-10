import { describe, it, expect } from 'vitest'
import frRules from '../../i18n/locales/fr/rules.json' with { type: 'json' }
import enRules from '../../i18n/locales/en/rules.json' with { type: 'json' }
import { RAW_RULES, PUBLISHED_RULE_IDS, getPublishedRuleIds, isRulePublished } from '../../shared/utils/rules-list'
import { getRuleKnowledge } from '../../shared/utils/rule-knowledge'

// CONTRAT D'ARCHI des fiches /docs/rules/[slug] (Step 1 de feat-fiches-regles-ssr).
// Ne teste PAS le contenu (rédigé/relu vague par vague) — teste la MÉCANIQUE qui garantit
// qu'aucune fiche cassée ou incomplète ne part en prod :
//   • slugs figés, uniques PAR locale, exhaustifs (une fiche = une URL sûre, FR + EN) ;
//   • porte de publication : un id `published` DOIT exister + avoir tldr/exemple/scanHook FR ET EN.
// La parité FR⇄EN générale (dont knowledge/tldr/whenNotAProblem/faq) est déjà couverte par
// locales-parity.test.ts (flatten de tout rules.json).

const RULE_IDS = RAW_RULES.map(r => r.id)
const frSlugs = frRules.slugs as Record<string, string>
const enSlugs = enRules.slugs as Record<string, string>
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

describe('fiches de règles — slugs', () => {
  it('chaque règle du catalogue a un slug FR et un slug EN', () => {
    const missingFr = RULE_IDS.filter(id => !frSlugs[id])
    const missingEn = RULE_IDS.filter(id => !enSlugs[id])
    expect(missingFr, 'règles sans slug FR').toEqual([])
    expect(missingEn, 'règles sans slug EN').toEqual([])
  })

  it('aucun slug orphelin (slug sans règle correspondante)', () => {
    const orphansFr = Object.keys(frSlugs).filter(id => !RULE_IDS.includes(id))
    const orphansEn = Object.keys(enSlugs).filter(id => !RULE_IDS.includes(id))
    expect(orphansFr, 'slugs FR orphelins').toEqual([])
    expect(orphansEn, 'slugs EN orphelins').toEqual([])
  })

  it('slugs uniques dans chaque locale (deux règles ≠ deux URLs)', () => {
    for (const [locale, slugs] of [['fr', frSlugs], ['en', enSlugs]] as const) {
      const values = Object.values(slugs)
      const dups = values.filter((s, i) => values.indexOf(s) !== i)
      expect([...new Set(dups)], `slugs dupliqués en ${locale}`).toEqual([])
    }
  })

  it('slugs en kebab-case (URL propre, jamais renommé sans 301)', () => {
    for (const [locale, slugs] of [['fr', frSlugs], ['en', enSlugs]] as const) {
      const bad = Object.entries(slugs).filter(([, s]) => !SLUG_RE.test(s)).map(([id, s]) => `${id}:${s}`)
      expect(bad, `slugs mal formés en ${locale}`).toEqual([])
    }
  })
})

describe('fiches de règles — porte de publication (published)', () => {
  it('tout id publié existe dans le catalogue', () => {
    const unknown = [...PUBLISHED_RULE_IDS].filter(id => !RULE_IDS.includes(id))
    expect(unknown, 'ids publiés absents de RAW_RULES').toEqual([])
  })

  it('getPublishedRuleIds suit l\'ordre du catalogue et matche le set', () => {
    const expected = RULE_IDS.filter(id => PUBLISHED_RULE_IDS.has(id))
    expect(getPublishedRuleIds()).toEqual(expected)
    expect(getPublishedRuleIds().every(isRulePublished)).toBe(true)
  })

  it.each([...PUBLISHED_RULE_IDS])('%s : tldr + exemple + scanHook présents en FR ET EN', (id) => {
    for (const locale of ['fr', 'en'] as const) {
      const k = getRuleKnowledge(id, locale)
      expect(k, `${id} sans knowledge en ${locale}`).toBeTruthy()
      expect(k?.tldr?.trim(), `${id} sans tldr en ${locale}`).toBeTruthy()
      expect(k?.exemple?.avant?.trim(), `${id} sans exemple.avant en ${locale}`).toBeTruthy()
      expect(k?.scanHook?.trim(), `${id} sans scanHook en ${locale}`).toBeTruthy()
    }
  })
})
