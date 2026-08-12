import { describe, it, expect } from 'vitest'
import { buildZoneReport } from './report-builder'
import { renderReportMarkdown } from './report-markdown'

const BASE = {
  site: { name: 'Mon site', domain: 'exemple.fr' },
  zone: { name: null, isDefault: true },
  openAlerts: [],
  repairedAlerts: [],
  generatedAt: '2026-07-02T12:00:00.000Z',
}

describe('renderReportMarkdown — purge du monitoring (410 digérés)', () => {
  it('affiche la ligne quand des pages ont été purgées', () => {
    const md = renderReportMarkdown(buildZoneReport({
      ...BASE,
      crawl: { completedAt: '2026-07-02T10:00:00.000Z', pagesScanned: 100, pagesTotal: 100, pagesPurged: 347 },
    }))
    expect(md).toContain('347 pages retirées du monitoring')
    expect(md).toContain('digérée par Google')
  })

  it('aucune ligne quand rien n a été purgé', () => {
    const md = renderReportMarkdown(buildZoneReport({
      ...BASE,
      crawl: { completedAt: '2026-07-02T10:00:00.000Z', pagesScanned: 100, pagesTotal: 100 },
    }))
    expect(md).not.toContain('retirée')
  })
})

describe('renderReportMarkdown — locale en (traduite)', () => {
  it('rend le rapport en anglais, clés YAML inchangées', () => {
    const md = renderReportMarkdown(buildZoneReport({
      ...BASE,
      locale: 'en',
      crawl: { completedAt: '2026-07-02T10:00:00.000Z', pagesScanned: 100, pagesTotal: 100 },
    }))
    expect(md).not.toContain('État de santé SEO') // rendu EN (en/report.json traduit)
    expect(md).not.toContain('Toutes les pages') // zone par défaut traduite aussi
    expect(md).toContain('genere_le:') // clés YAML language-agnostic, jamais traduites
    expect(md).not.toContain('report.') // aucune clé i18n brute qui fuit dans le rendu
  })
})

describe('renderReportMarkdown — couverture d analyse', () => {
  const crawlBase = { completedAt: '2026-07-02T10:00:00.000Z', pagesScanned: 433, pagesTotal: 433 }

  it('annonce l analyse partielle AVANT le verdict', () => {
    const md = renderReportMarkdown(buildZoneReport({
      ...BASE,
      crawl: { ...crawlBase, coverage: { analysable: 433, analysed: 214, pct: 49, causes: [{ key: 'notRetrieved', count: 219 }] } },
    }))
    expect(md).toContain('214 des 433 pages à surveiller ont été analysées (49 %)')
    expect(md).toContain('219 non récupérées')
    // La portée doit précéder la conclusion qu elle conditionne.
    expect(md.indexOf('Analyse partielle')).toBeLessThan(md.indexOf('## Verdict'))
  })

  it('porte la portée DANS le titre du verdict', () => {
    // Seul endroit où la troncature d un LLM ne peut pas séparer la conclusion de sa limite.
    const md = renderReportMarkdown(buildZoneReport({
      ...BASE,
      crawl: { ...crawlBase, coverage: { analysable: 433, analysed: 214, pct: 49, causes: [] } },
    }))
    expect(md).toMatch(/## Verdict : .*\(établi sur 49 % des pages à surveiller\)/)
  })

  it('le tableau compte les pages ANALYSÉES, pas les pages tentées', () => {
    const md = renderReportMarkdown(buildZoneReport({
      ...BASE,
      crawl: { ...crawlBase, coverage: { analysable: 433, analysed: 214, pct: 49, causes: [] } },
    }))
    expect(md).toContain('Pages analysées')
    expect(md).toContain('| 214 |')
  })

  it('couverture complète : une ligne, aucune cause, aucune portée dans le verdict', () => {
    const md = renderReportMarkdown(buildZoneReport({
      ...BASE,
      crawl: { ...crawlBase, coverage: { analysable: 433, analysed: 433, pct: 100, causes: [] } },
    }))
    expect(md).toContain('Analyse complète')
    expect(md).not.toContain('établi sur')
  })

  it('crawl antérieur à la mesure : « non mesurée », jamais « 0 % »', () => {
    // Les anciens crawls n ont pas les compteurs en base → coverage null.
    const md = renderReportMarkdown(buildZoneReport({ ...BASE, crawl: crawlBase }))
    expect(md).toContain('Couverture non mesurée')
    expect(md).not.toContain('0 %')
  })

  it('n additionne jamais deux causes', () => {
    const md = renderReportMarkdown(buildZoneReport({
      ...BASE,
      crawl: { ...crawlBase, coverage: { analysable: 433, analysed: 100, pct: 23, causes: [
        { key: 'blocked', count: 200 }, { key: 'notRetrieved', count: 133 },
      ] } },
    }))
    expect(md).toContain('200 bloquées par votre pare-feu (requête HTTP)')
    expect(md).toContain('133 non récupérées')
    expect(md).not.toContain('333')
  })
})

describe('renderReportMarkdown — frontmatter lu par les IA', () => {
  const crawl = { completedAt: '2026-07-02T10:00:00.000Z', pagesScanned: 433, pagesTotal: 433 }

  it('porte la couverture, et plus le compteur des pages TENTÉES', () => {
    const md = renderReportMarkdown(buildZoneReport({
      ...BASE,
      crawl: { ...crawl, coverage: { analysable: 433, analysed: 214, pct: 49, causes: [{ key: 'notRetrieved', count: 219 }] } },
    }))
    expect(md).toContain('pages_a_surveiller: 433')
    expect(md).toContain('pages_analysees: 214')
    expect(md).toContain('couverture_pct: 49')
    expect(md).toContain('couverture_portee: partielle')
    expect(md).toContain('non_analysees_non_recuperees: 219')
    // Ce champ affirmait que tout avait été analysé : une IA le recopiait tel quel.
    expect(md).not.toContain('pages_crawlees')
  })

  it('déclare la couverture non mesurée plutôt qu un zéro trompeur', () => {
    const md = renderReportMarkdown(buildZoneReport({ ...BASE, crawl }))
    expect(md).toContain('couverture_portee: non_mesuree')
    expect(md).not.toContain('couverture_pct: 0')
  })

  it('l en-tête annonce l ensemble monitoré, pas les pages tentées', () => {
    // pagesScanned < pagesTotal : le crawl a été interrompu. L en-tête doit dire 500.
    const md = renderReportMarkdown(buildZoneReport({
      ...BASE, crawl: { completedAt: crawl.completedAt, pagesScanned: 120, pagesTotal: 500 },
    }))
    expect(md).toContain('500 pages à surveiller')
    expect(md).not.toContain('120 pages à surveiller')
  })
})
