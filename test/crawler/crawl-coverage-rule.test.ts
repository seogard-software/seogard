import { describe, it, expect } from 'vitest'
import { decideCoverageAlert, COVERAGE_RULE_ID } from '../../crawler/crawl-coverage-rule'

const base = {
  anchorUrl: 'https://site.fr/',
  pagesTotal: 100,
  pagesBlocked: 0,
  pagesFailed: 0,
  pagesRendered: 100,
  pagesCsrFailed: 0,
  pagesCsrBlocked: 0,
  pagesNotComparable: 0,
}

describe('règle de couverture — décision', () => {
  it('couverture complète : aucune alerte, et l’alerte ouverte se ferme', () => {
    const d = decideCoverageAlert(base)
    expect(d.alert).toBeNull()
    expect(d.shouldResolve).toBe(true)
  })

  it('se déclenche au PREMIER crawl : aucune baseline n’entre dans la décision', () => {
    // Les seules entrées sont les compteurs de CE crawl. Une règle event serait muette ici.
    const d = decideCoverageAlert({ ...base, pagesRendered: 4, pagesFailed: 96 })
    expect(d.alert?.severity).toBe('critical')
    expect(d.shouldResolve).toBe(false)
  })

  it('le cas omneseducation.com produit bien un critical', () => {
    // Mesuré en prod le 2026-08-11 : 7 176 pages au sitemap, 292 réellement analysées.
    const d = decideCoverageAlert({ ...base, pagesTotal: 7176, pagesRendered: 292, pagesFailed: 36 })
    expect(d.alert?.severity).toBe('critical')
    expect(d.alert?.message).toBe('Only 292 of 7176 pages were fully analysed (4%)')
  })

  it('l’alerte est ancrée sur l’URL racine du site', () => {
    const d = decideCoverageAlert({ ...base, anchorUrl: 'https://site.fr/fr/', pagesRendered: 10 })
    expect(d.alert?.pageUrl).toBe('https://site.fr/fr/')
    expect(d.alert?.type).toBe(COVERAGE_RULE_ID)
    expect(d.alert?.category).toBe('state')
  })

  it('la ventilation ne fusionne jamais deux causes', () => {
    const d = decideCoverageAlert({
      ...base, pagesTotal: 1000, pagesRendered: 100,
      pagesBlocked: 300, pagesFailed: 500, pagesCsrFailed: 50, pagesCsrBlocked: 50,
    })
    expect(d.alert?.currentValue).toBe(
      '300 blocked by firewall (HTTP fetch) · 500 not retrieved · 50 JavaScript rendering failed · 50 blocked by firewall (JavaScript rendering)',
    )
  })

  it('compteur évincé : ni alerte, ni fermeture abusive de ce qui existe', () => {
    const d = decideCoverageAlert({ ...base, pagesRendered: null })
    expect(d.alert).toBeNull()
    // shouldResolve reste vrai : sans mesure on ne laisse pas traîner une alerte non vérifiable.
    expect(d.coverage.measurable).toBe(false)
  })

  it('les redirections ne comptent pas comme des pages manquantes', () => {
    const d = decideCoverageAlert({ ...base, pagesTotal: 100, pagesNotComparable: 30, pagesRendered: 70 })
    expect(d.alert).toBeNull()
    expect(d.coverage.pct).toBe(100)
  })
})
