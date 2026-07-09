import { describe, it, expect } from 'vitest'
// On importe COMPARATOR (comme la prod : c'est lui qui charge tous les fichiers de règles pour
// déclencher leurs registerRule). Si un import de règle disparaît de comparator, une règle du
// catalogue n'est plus enregistrée → ce test casse. C'est le filet contre une régression de
// détection silencieuse (les tests par règle importent chaque fichier en direct et ne verraient
// PAS un import manquant côté comparator).
import '../../crawler/comparator'
import { getRegisteredRuleIds } from '../../crawler/rules/engine'
import { RULES } from '../../shared/utils/rules-catalog'

// Règles du catalogue qui ne passent PAS par le moteur de comparaison (émises directement) :
// ssr_blocked = détection anti-bot (WAF) dans worker.ts, jamais via runAllRules.
const NON_ENGINE_RULES = new Set(['ssr_blocked'])

describe('registre du moteur — complétude vs catalogue', () => {
  it('chaque règle du catalogue (hors émises directement) est enregistrée via comparator', () => {
    const registered = new Set(getRegisteredRuleIds())
    const missing = RULES
      .map(r => r.id)
      .filter(id => !NON_ENGINE_RULES.has(id) && !registered.has(id))
    expect(missing, `règles du catalogue NON enregistrées (import manquant dans comparator.ts ?) : ${missing.join(', ')}`).toEqual([])
  })

  it('aucune règle enregistrée n\'est absente du catalogue', () => {
    const catalogIds = new Set(RULES.map(r => r.id))
    const orphans = getRegisteredRuleIds().filter(id => !catalogIds.has(id))
    expect(orphans, `règles enregistrées absentes du catalogue : ${orphans.join(', ')}`).toEqual([])
  })
})
