import { describe, it, expect } from 'vitest'
import { readFileSync, globSync } from 'node:fs'
import { RULES_COUNT, RULES } from '../../shared/utils/rules-catalog'

// TRIPWIRE anti-divergence de comptage : le nombre de règles affiché sur le site vient
// TOUJOURS de RULES_COUNT (source unique = le catalogue). Ce test échoue si un littéral
// numérique accolé à « règles/rules » réapparaît dans le contenu public — la cause du bug
// « 65+ sur la home, 65 sur /outils/audit, 71 en réalité » (2026-07-03).

const SCANNED = [
  ...globSync('app/pages/**/*.vue'),
  ...globSync('app/layouts/*.vue'),
  ...globSync('server/routes/*.ts'),
  ...globSync('shared/utils/*.ts'),
  ...globSync('app/components/**/*.vue'),
].filter(f => !f.endsWith('.test.ts'))

// Interdit : un nombre ≥ 10 collé à « règles / rules » (les petits compteurs dynamiques
// de l'UI dashboard ne produisent jamais de littéral ≥ 10 en dur).
const HARDCODED_COUNT = /\b\d{2,}\s*\+?\s*(règles|rules)\b/i

describe('comptage de règles — source unique dynamique', () => {
  it('RULES_COUNT reflète le catalogue', () => {
    expect(RULES_COUNT).toBe(RULES.length)
    expect(RULES_COUNT).toBeGreaterThan(50)
  })

  it('AUCUN littéral de comptage en dur dans les pages, layouts et routes publiques', () => {
    expect(SCANNED.length).toBeGreaterThan(10)
    for (const file of SCANNED) {
      const content = readFileSync(file, 'utf8')
      const match = content.match(HARDCODED_COUNT)
      expect(match, `${file} contient « ${match?.[0]} » en dur — utilise RULES_COUNT (shared/utils/rules-catalog.ts), jamais un littéral`).toBeNull()
    }
  })
})
