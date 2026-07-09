import { describe, it, expect } from 'vitest'
import { readFileSync, globSync } from 'node:fs'

// TRIPWIRE anti-FR-en-dur (étape 12 du plan i18n) : après l'extraction, plus AUCUNE chaîne
// française ne doit vivre hors des fichiers de locale. On détecte les accents dans le code
// UI/serveur, hors liste blanche (contenus volontairement FR-only) et hors commentaires.

const WHITELIST = [
  'app/pages/legal/', // légal FR-only v1 (traduction juridique dédiée plus tard)
  'app/pages/formations/', // formations FR-only au lancement (décision plan)
  'app/pages/docs/emails/', // previews internes dev-only
  'i18n/locales/', // les locales elles-mêmes
  'server/routes/docs/emails/preview/', // sample data des previews internes (angle mort O, liste blanche plan)
  'shared/utils/crawl-schedule.ts', // code partagé front/back : Records de libellés par locale DANS le fichier (étape 6)
  'crawler/fetcher.ts', // patterns de détection soft-404 multilingues (doivent matcher les pages FR)
  'crawler/rules/helpers.ts', // patterns de détection WAF/anti-bot multilingues (idem)
]

const SCANNED = [
  ...globSync('app/**/*.{vue,ts}'),
  ...globSync('server/**/*.ts'),
  ...globSync('shared/**/*.ts'),
  ...globSync('crawler/**/*.ts'),
].filter(f => !f.endsWith('.test.ts') && !WHITELIST.some(w => f.startsWith(w)))

const FRENCH_CHARS = /[àâäéèêëîïôöùûüçœÀÂÄÉÈÊËÎÏÔÖÙÛÜÇŒ]/

// Retire commentaires (//, /* */, <!-- -->) : un accent en commentaire de code est toléré.
// Noms propres légitimes (adresse légale, marques) tolérés dans du contenu EN.
const PROPER_NOUNS = /Créteil|Les Numériques|Aadil|Vitry|Camille/g

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
    .replace(/<!--[\s\S]*?-->/g, '')
}

describe('i18n — zéro chaîne française hors fichiers de locale', () => {
  it('aucun accent dans le code (hors commentaires et liste blanche)', () => {
    expect(SCANNED.length).toBeGreaterThan(100)
    const offenders: string[] = []
    for (const file of SCANNED) {
      const content = stripComments(readFileSync(file, 'utf8')).replace(PROPER_NOUNS, '')
      if (FRENCH_CHARS.test(content)) {
        const line = content.split('\n').findIndex(l => FRENCH_CHARS.test(l)) + 1
        offenders.push(`${file}:${line}`)
      }
    }
    expect(offenders, `Chaînes FR hors locales :\n${offenders.join('\n')}`).toEqual([])
  })
})
