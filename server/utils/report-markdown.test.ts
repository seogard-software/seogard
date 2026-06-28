import { describe, it, expect } from 'vitest'
import { buildZoneReport } from './report-builder'
import { renderReportMarkdown } from './report-markdown'

const BASE = {
  site: { name: 'Mon site', domain: 'exemple.fr' },
  zone: { name: null, isDefault: true },
  crawl: { completedAt: '2026-06-11T10:00:00.000Z', pagesScanned: 100, pagesTotal: 120 },
  openAlerts: [],
  repairedAlerts: [],
  generatedAt: '2026-06-11T12:00:00.000Z',
}

describe('renderReportMarkdown — sortie de sitemap', () => {
  it('affiche le compte (frontmatter + corps) quand des pages ont quitté le sitemap', () => {
    const md = renderReportMarkdown(buildZoneReport({ ...BASE, sitemapRemoved: { count: 287, nonOkCount: 12 } }))
    expect(md).toContain('pages_sorties_du_sitemap: 287')
    expect(md).toContain('287 pages')
    expect(md).toContain('ont quitté votre sitemap')
    expect(md).toContain('12 qui ne répondent plus en 200')
  })

  it('frontmatter à 0 et aucune ligne corps quand rien n\'a quitté le sitemap', () => {
    const md = renderReportMarkdown(buildZoneReport({ ...BASE, sitemapRemoved: null }))
    expect(md).toContain('pages_sorties_du_sitemap: 0')
    expect(md).not.toContain('ont quitté votre sitemap')
  })
})
