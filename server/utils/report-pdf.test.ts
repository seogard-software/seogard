import { describe, it, expect } from 'vitest'
import { buildZoneReport } from './report-builder'
import { buildReportDocDefinition, renderReportPdf } from './report-pdf'

const SAMPLE = buildZoneReport({
  site: { name: 'Mon site', domain: 'exemple.fr' },
  zone: { name: 'Blog', isDefault: false },
  crawl: { completedAt: '2026-06-11T10:00:00.000Z', pagesScanned: 120, pagesTotal: 150 },
  openAlerts: [
    { ruleId: 'ssr_content_mismatch', pageUrl: 'https://exemple.fr/p1', severity: 'critical', message: 'SSR 8% du contenu CSR', previousValue: null, currentValue: '8%' },
    { ruleId: 'rec_h1_missing_in_ssr', pageUrl: 'https://exemple.fr/p1', severity: 'warning', message: 'H1 absent du HTML brut' },
    { ruleId: 'rec_llms_txt_missing', pageUrl: 'https://exemple.fr/', severity: 'info', message: 'Pas de llms.txt' },
  ],
  repairedAlerts: [{ ruleId: 'h1_missing', pageUrl: 'https://exemple.fr/old' }],
  generatedAt: '2026-06-11T12:00:00.000Z',
})

describe('report-pdf', () => {
  it('synthèse exécutive : verdict, signature, cadrage métier, tableau régressions, renvoi Markdown', () => {
    const def = buildReportDocDefinition(SAMPLE)
    const json = JSON.stringify(def)
    expect(json).toContain('État de santé SEO')
    expect(json).toContain('contenu différent de vos visiteurs')
    expect(json).toContain('Ce que ça signifie pour vous')
    expect(json).toContain('Régressions')
    expect(json).toContain('Action recommandée') // en-tête du tableau compact
    expect(json).toContain('Export pour IA') // renvoi vers l export exhaustif
    expect(json).not.toMatch(/"P0/) // pas de jargon interne
  })

  it('synthèse courte : pas d annexe par page ni fiches longues dans le PDF', () => {
    const def = buildReportDocDefinition(SAMPLE)
    const json = JSON.stringify(def)
    expect(json).not.toContain('Annexe') // l annexe par page vit dans le Markdown, pas le PDF
    expect(json).not.toContain('Pourquoi.') // les fiches longues ne sont plus dans le PDF
  })

  it('génère un vrai PDF (magic bytes %PDF)', async () => {
    const buffer = await renderReportPdf(SAMPLE)
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buffer.length).toBeGreaterThan(3000)
  })
})
