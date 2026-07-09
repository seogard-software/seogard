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
