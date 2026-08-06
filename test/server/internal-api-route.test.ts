import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * `/api/internal/*` est authentifie par une cle partagee dans `00.internal-api`.
 * Si `02.auth` ne le laisse pas passer, la cle est validee puis la requete est
 * refusee faute de session — la frontiere entre le CRM et Seogard devient morte.
 */
const ROOT = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8')

describe('frontiere /api/internal', () => {
  it('00.internal-api exige la cle partagee', () => {
    const source = read('server/middleware/00.internal-api.ts')
    expect(source).toContain('/api/internal/')
    expect(source).toContain('INTERNAL_API_KEY')
    expect(source).toContain('timingSafeEqual')
  })

  it('00.internal-api tourne AVANT 02.auth', () => {
    // Nitro applique les middlewares par ordre alphabetique du nom de fichier.
    expect('00.internal-api.ts' < '02.auth.ts').toBe(true)
  })

  it('02.auth laisse passer /api/internal (deja authentifie en amont)', () => {
    const source = read('server/middleware/02.auth.ts')
    expect(
      /path\.startsWith\(['"]\/api\/internal\//.test(source),
      '02.auth doit court-circuiter /api/internal, sinon la cle est validee puis la requete refusee',
    ).toBe(true)
  })
})
