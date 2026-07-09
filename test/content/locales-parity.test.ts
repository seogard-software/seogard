import { describe, it, expect } from 'vitest'
import { readFileSync, globSync } from 'node:fs'

// PARITÉ des locales (étape 12 du plan i18n) : à la publication EN, chaque clé FR existe en EN
// et réciproquement — le fallback FR ne doit couvrir que l'imprévu, jamais un trou connu.
// (Les fichiers FR-only par décision — formations/legal — ne passent pas par les locales.)

function flatten(obj: unknown, prefix = ''): string[] {
  if (obj == null || typeof obj !== 'object') return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k))
}

const FR_FILES = globSync('i18n/locales/fr/*.json')

describe('locales — parité de clés fr/en', () => {
  it.each(FR_FILES.map(f => [f.split('/').pop()!]))('%s : mêmes clés en fr et en en', (basename) => {
    const fr = JSON.parse(readFileSync(`i18n/locales/fr/${basename}`, 'utf8'))
    const en = JSON.parse(readFileSync(`i18n/locales/en/${basename}`, 'utf8'))
    const frKeys = new Set(flatten(fr))
    const enKeys = new Set(flatten(en))
    const missingInEn = [...frKeys].filter(k => !enKeys.has(k))
    const orphansInEn = [...enKeys].filter(k => !frKeys.has(k))
    expect(missingInEn, `clés FR sans traduction EN dans ${basename}`).toEqual([])
    expect(orphansInEn, `clés EN orphelines (absentes du FR) dans ${basename}`).toEqual([])
  })

  it('aucune valeur EN ne contient de français (accents)', () => {
    // Noms propres légitimes (adresse légale, juridiction) tolérés dans du contenu EN — ex. la
    // ville de Créteil (RCS / tribunaux) dans les pages légales.
    const PROPER_NOUNS = /Créteil/g
    for (const f of globSync('i18n/locales/en/*.json')) {
      const values = JSON.stringify(JSON.parse(readFileSync(f, 'utf8'))).replace(PROPER_NOUNS, '')
      const hits = values.match(/[àâäéèêëîïôöùûüçœÀÂÄÉÈÊËÎÏÔÖÙÛÜÇŒ]/g) ?? []
      expect(hits, `français résiduel dans ${f}`).toEqual([])
    }
  })
})
