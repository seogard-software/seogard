import { describe, it, expect } from 'vitest'
import { buildCrawlCoverage, type CrawlCoverageInput } from './crawl-coverage'

const base: CrawlCoverageInput = {
  pagesTotal: 100,
  pagesRendered: 100,
  pagesCsrFailed: 0,
  pagesCsrBlocked: 0,
  pagesBlocked: 0,
  pagesFailed: 0,
  pagesNotComparable: 0,
}

describe('buildCrawlCoverage', () => {
  it('ne signale rien quand tout a été analysé', () => {
    const c = buildCrawlCoverage(base)
    expect(c.pct).toBe(100)
    expect(c.severity).toBeNull()
    expect(c.causes).toEqual([])
  })

  it('sort les pages hors comparaison du dénominateur', () => {
    // 20 redirections : elles n'avaient pas à être rendues, elles ne manquent donc pas.
    const c = buildCrawlCoverage({ ...base, pagesTotal: 100, pagesNotComparable: 20, pagesRendered: 80 })
    expect(c.analysable).toBe(80)
    expect(c.pct).toBe(100)
    expect(c.severity).toBeNull()
  })

  describe('sévérité', () => {
    it('critical sous 50 %', () => {
      expect(buildCrawlCoverage({ ...base, pagesRendered: 49, pagesFailed: 51 }).severity).toBe('critical')
    })
    it('warning entre 50 et 95 %', () => {
      expect(buildCrawlCoverage({ ...base, pagesRendered: 50, pagesFailed: 50 }).severity).toBe('warning')
      expect(buildCrawlCoverage({ ...base, pagesRendered: 94, pagesFailed: 6 }).severity).toBe('warning')
    })
    it('info entre 95 et 99 %', () => {
      expect(buildCrawlCoverage({ ...base, pagesRendered: 95, pagesFailed: 5 }).severity).toBe('info')
      expect(buildCrawlCoverage({ ...base, pagesRendered: 99, pagesFailed: 1 }).severity).toBe('info')
    })
  })

  it('arrondit au plancher : 100 ne s’affiche que si tout est analysé', () => {
    // 999/1000 = 99,9 % — surtout pas « 100 % ».
    const c = buildCrawlCoverage({ ...base, pagesTotal: 1000, pagesRendered: 999, pagesFailed: 1 })
    expect(c.pct).toBe(99)
    expect(c.severity).toBe('info')
  })

  describe('donnée absente n’est pas donnée nulle', () => {
    it('compteur de rendu évincé → non mesurable, aucune alerte', () => {
      const c = buildCrawlCoverage({ ...base, pagesRendered: null })
      expect(c.measurable).toBe(false)
      expect(c.severity).toBeNull()
    })

    it('compteur d’échec CSR évincé → non mesurable, aucune alerte', () => {
      const c = buildCrawlCoverage({ ...base, pagesCsrFailed: null })
      expect(c.measurable).toBe(false)
      expect(c.severity).toBeNull()
    })

    it('sitemap vide → non mesurable', () => {
      expect(buildCrawlCoverage({ ...base, pagesTotal: 0, pagesRendered: 0 }).measurable).toBe(false)
    })
  })

  describe('règle de wording : une cause = un compteur', () => {
    it('chaque cause garde son propre nombre, jamais additionnée', () => {
      const c = buildCrawlCoverage({
        ...base, pagesTotal: 1000, pagesRendered: 100, pagesBlocked: 300, pagesFailed: 500, pagesCsrFailed: 100,
      })
      expect(c.causes).toEqual([
        { key: 'blocked', count: 300 },
        { key: 'notRetrieved', count: 500 },
        { key: 'renderFailed', count: 100 },
      ])
      // 300 + 500 + 100 = 900 = tout le manque : aucun reliquat inventé.
      expect(c.missing).toBe(900)
    })

    it('n’affiche pas une cause à zéro', () => {
      const c = buildCrawlCoverage({ ...base, pagesRendered: 60, pagesBlocked: 40 })
      expect(c.causes).toEqual([{ key: 'blocked', count: 40 }])
    })

    it('expose le reliquat au lieu de le rattacher à une cause plausible', () => {
      // Le cas mon-cadastre.fr : des pages manquent sans qu’aucun compteur ne l’explique.
      const c = buildCrawlCoverage({
        ...base, pagesTotal: 1000, pagesRendered: 200, pagesBlocked: 100, pagesFailed: 200, pagesCsrFailed: 0,
      })
      expect(c.missing).toBe(800)
      expect(c.causes).toContainEqual({ key: 'unexplained', count: 500 })
    })

    it('n’invente pas de reliquat quand les compteurs dépassent le manque', () => {
      const c = buildCrawlCoverage({ ...base, pagesRendered: 90, pagesBlocked: 50, pagesFailed: 50 })
      expect(c.causes.find(x => x.key === 'unexplained')).toBeUndefined()
    })

    it('affiche les compteurs BRUTS, sans jamais les plafonner sur le manque', () => {
      // 10 pages manquent mais le compteur de blocages en annonce 50 : on affiche 50, le
      // chiffre mesuré. Plafonner afficherait « 10 », un nombre que rien n'a mesuré.
      const c = buildCrawlCoverage({ ...base, pagesRendered: 90, pagesBlocked: 50 })
      expect(c.missing).toBe(10)
      expect(c.causes).toEqual([{ key: 'blocked', count: 50 }])
    })
  })

  it('sépare les deux blocages WAF : fetch HTTP et rendu JavaScript', () => {
    // Un WAF peut laisser passer le fetch et bloquer le navigateur : ce sont deux situations
    // distinctes, elles ne sont jamais comptées ensemble.
    const c = buildCrawlCoverage({ ...base, pagesRendered: 70, pagesBlocked: 10, pagesCsrBlocked: 20 })
    expect(c.causes).toEqual([
      { key: 'blocked', count: 10 },
      { key: 'renderBlocked', count: 20 },
    ])
  })

  it('borne les valeurs incohérentes plutôt que de produire un pourcentage faux', () => {
    // Plus de rendus que de pages analysables : on plafonne, on ne dépasse jamais 100 %.
    const c = buildCrawlCoverage({ ...base, pagesTotal: 10, pagesRendered: 50 })
    expect(c.analysed).toBe(10)
    expect(c.pct).toBe(100)
    expect(c.missing).toBe(0)
  })
})
