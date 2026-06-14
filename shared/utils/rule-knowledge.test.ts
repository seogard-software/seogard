import { describe, it, expect } from 'vitest'
import { RULES } from './rules-catalog'
import { RULE_KNOWLEDGE, getRuleKnowledge } from './rule-knowledge'

describe('rule-knowledge — exhaustivité et qualité', () => {
  it('chaque règle du catalogue a sa fiche', () => {
    const missing = RULES.map(r => r.id).filter(id => !RULE_KNOWLEDGE[id])
    expect(missing).toEqual([])
  })

  it('aucune fiche orpheline (fiche sans règle au catalogue)', () => {
    const catalogIds = new Set(RULES.map(r => r.id))
    const orphans = Object.keys(RULE_KNOWLEDGE).filter(id => !catalogIds.has(id))
    expect(orphans).toEqual([])
  })

  it('les 4 blocs de chaque fiche sont non vides', () => {
    for (const [id, fiche] of Object.entries(RULE_KNOWLEDGE)) {
      expect(fiche.constat.length, `${id}.constat`).toBeGreaterThan(10)
      expect(fiche.pourquoi.length, `${id}.pourquoi`).toBeGreaterThan(20)
      expect(fiche.action.length, `${id}.action`).toBeGreaterThan(10)
      expect(fiche.gain.length, `${id}.gain`).toBeGreaterThan(10)
    }
  })

  it('aucun pourcentage de gain inventé dans les fiches', () => {
    for (const [id, fiche] of Object.entries(RULE_KNOWLEDGE)) {
      // Un « +X% » dans gain/pourquoi serait une promesse chiffrée interdite.
      expect(fiche.gain, `${id}.gain`).not.toMatch(/\+\s?\d+\s?%/)
      expect(fiche.pourquoi, `${id}.pourquoi`).not.toMatch(/\+\s?\d+\s?%/)
    }
  })

  it('getRuleKnowledge renvoie null pour une règle inconnue', () => {
    expect(getRuleKnowledge('rule_inexistante')).toBeNull()
    expect(getRuleKnowledge('noindex_added')).not.toBeNull()
  })
})
