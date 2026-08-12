import { describe, it, expect } from 'vitest'
import mongoose from 'mongoose'
import { Crawl } from '../../server/database/models'
import {
  COVERAGE_CAUSE_LABEL,
  formatCoverageCauses,
  buildCrawlCoverage,
} from '../../shared/utils/crawl-coverage'

/**
 * Contrainte n°1 de la feature : on ne nomme une cause que si elle est MESURÉE, et deux
 * compteurs ne sont jamais fusionnés sous un libellé commun. Écrire « 3 000 bloquées par un
 * pare-feu » quand ces 3 000 recouvrent trois situations différentes serait une affirmation
 * fausse. Ce test verrouille la règle plutôt que de compter sur la bonne intention.
 */
describe('wording des causes de couverture', () => {
  it('chaque cause a son libellé propre — aucun libellé partagé', () => {
    const labels = Object.values(COVERAGE_CAUSE_LABEL)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('le libellé des échecs de récupération ne prétend PAS connaître la raison', () => {
    // pagesFailed regroupe timeout, DNS et 5xx sans les distinguer : le libellé décrit donc le
    // symptôme. Le jour où on saura les séparer, on pourra nommer la cause — pas avant.
    const label = COVERAGE_CAUSE_LABEL.notRetrieved
    expect(label).toBe('not retrieved')
    for (const mot of ['firewall', 'timeout', 'dns', 'server', 'blocked']) {
      expect(label.toLowerCase()).not.toContain(mot)
    }
  })

  it('« bloquées par un pare-feu » n’est employé que pour le compteur anti-bot', () => {
    // Deux blocages WAF distincts (fetch HTTP vs rendu JS) → DEUX libellés distincts,
    // jamais un seul mot « pare-feu » qui les confondrait.
    const usages = Object.entries(COVERAGE_CAUSE_LABEL).filter(([, v]) => v.includes('firewall'))
    expect(usages).toEqual([
      ['blocked', 'blocked by firewall (HTTP fetch)'],
      ['renderBlocked', 'blocked by firewall (JavaScript rendering)'],
    ])
  })

  it('la ventilation affiche chaque nombre séparément, sans jamais additionner', () => {
    const { causes } = buildCrawlCoverage({
      pagesTotal: 1000, pagesRendered: 100, pagesCsrFailed: 100,
      pagesBlocked: 300, pagesFailed: 500, pagesCsrBlocked: 0, pagesNotComparable: 0,
    })
    const rendu = formatCoverageCauses(causes)
    expect(rendu).toBe('300 blocked by firewall (HTTP fetch) · 500 not retrieved · 100 JavaScript rendering failed')
    // Le total 900 n'apparaît nulle part : il masquerait trois situations distinctes.
    expect(rendu).not.toContain('900')
  })

  it('le reliquat est nommé « unexplained », jamais rattaché à une cause plausible', () => {
    const { causes } = buildCrawlCoverage({
      pagesTotal: 1000, pagesRendered: 200, pagesCsrFailed: 0,
      pagesBlocked: 100, pagesFailed: 200, pagesCsrBlocked: 0, pagesNotComparable: 0,
    })
    expect(formatCoverageCauses(causes)).toContain('500 unexplained')
  })
})

/**
 * Mongoose est strict : un champ non déclaré au schéma est SUPPRIMÉ silencieusement à
 * l'écriture. C'est l'incident `Site.siteContext` (2026-06-03), où les régressions GEO
 * site-level n'ont jamais pu se déclencher en prod. On vérifie la déclaration, pas l'intention.
 */
describe('schéma Crawl — compteurs de couverture déclarés', () => {
  it.each(['pagesRendered', 'pagesCsrFailed', 'pagesCsrBlocked', 'pagesNotComparable'])('%s existe au schéma', (champ) => {
    const path = Crawl.schema.path(champ)
    expect(path, `${champ} absent du schéma → Mongoose le supprimerait à l'écriture`).toBeDefined()
    expect(path.instance).toBe('Number')
  })

  it('un document construit conserve les trois compteurs', () => {
    const crawl = new Crawl({
      siteId: new mongoose.Types.ObjectId(),
      zoneId: new mongoose.Types.ObjectId(),
      status: 'completed',
      pagesRendered: 1024,
      pagesCsrFailed: 7,
      pagesCsrBlocked: 33,
      pagesNotComparable: 210,
    })
    expect(crawl.pagesRendered).toBe(1024)
    expect(crawl.pagesCsrFailed).toBe(7)
    expect(crawl.pagesCsrBlocked).toBe(33)
    expect(crawl.pagesNotComparable).toBe(210)
  })
})
