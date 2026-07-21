import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Les 2 pages « concurrent » Oseox : mots-clés ciblés, parité du tableau factuel, sitemap,
// et surtout ZÉRO donnée non vérifiée (pas de « La Poste ») + le fait pivot bien sourcé.
const frRaw = readFileSync('i18n/locales/fr/compare.json', 'utf8')
const enRaw = readFileSync('i18n/locales/en/compare.json', 'utf8')
const fr = JSON.parse(frRaw).compare
const en = JSON.parse(enRaw).compare

describe('pages Oseox — contenu', () => {
  it('les titres SEO ciblent Oseox (mot-clé présent, FR + EN)', () => {
    for (const c of [fr, en]) {
      expect(c.alternativeOseox.seo.title.toLowerCase()).toContain('oseox')
      expect(c.vsSeogard.seo.title.toLowerCase()).toContain('oseox')
    }
  })

  it('le tableau comparatif : même nombre de lignes FR/EN et >5 lignes', () => {
    expect(fr.table.rows.length).toBe(en.table.rows.length)
    expect(fr.table.rows.length).toBeGreaterThan(5)
  })

  it('ZÉRO donnée non vérifiée : pas de « La Poste » dans le wording', () => {
    expect((frRaw + enRaw).toLowerCase()).not.toContain('la poste')
  })

  it('le fait pivot = la citation first-party sourcée', () => {
    expect(fr.vsSeogard.jsDiff.verbatim).toContain('does not execute Javascript')
    expect(en.vsSeogard.jsDiff.verbatim).toContain('does not execute Javascript')
    expect(fr.vsSeogard.jsDiff.verbatimSource.toLowerCase()).toContain('oseox')
  })

  it('le sitemap inclut les 2 pages Oseox', () => {
    const src = readFileSync('server/routes/sitemap.xml.ts', 'utf8')
    expect(src).toContain('/alternative-oseox')
    expect(src).toContain('/oseox-vs-seogard')
  })
})
