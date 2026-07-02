import { describe, it, expect } from 'vitest'
import { buildZoneReport, isSignatureRule, REPORT_CAPS, type ReportAlertInput } from './report-builder'

const BASE = {
  site: { name: 'Mon site', domain: 'exemple.fr' },
  zone: { name: 'Blog', isDefault: false },
  crawl: { completedAt: '2026-06-11T10:00:00.000Z', pagesScanned: 120, pagesTotal: 150 },
  repairedAlerts: [],
  generatedAt: '2026-06-11T12:00:00.000Z',
}

function alert(over: Partial<ReportAlertInput>): ReportAlertInput {
  return { ruleId: 'h1_missing', pageUrl: 'https://exemple.fr/a', severity: 'critical', message: 'msg', ...over }
}

describe('buildZoneReport', () => {
  it('verdict : compte les régressions par sévérité, jamais les recommandations', () => {
    const report = buildZoneReport({
      ...BASE,
      openAlerts: [
        alert({ ruleId: 'noindex_added', severity: 'critical' }),
        alert({ ruleId: 'h1_multiple', severity: 'warning', pageUrl: 'https://exemple.fr/b' }),
        alert({ ruleId: 'rec_img_alt_audit', severity: 'info', pageUrl: 'https://exemple.fr/c' }),
      ],
    })
    expect(report.verdict.critical).toBe(1)
    expect(report.verdict.warning).toBe(1)
    expect(report.verdict.info).toBe(0) // la reco ne compte pas dans les régressions
    expect(report.verdict.recommendations).toBe(1)
    expect(report.verdict.status).toBe('critical')
  })

  it('régressions et recommandations ne sont jamais mélangées', () => {
    const report = buildZoneReport({
      ...BASE,
      openAlerts: [
        alert({ ruleId: 'meta_title_missing', severity: 'critical' }),
        alert({ ruleId: 'rec_h1_missing_in_ssr', severity: 'warning' }),
      ],
    })
    const regIds = Object.values(report.regressions).flat().map(e => e.ruleId)
    expect(regIds).toContain('meta_title_missing')
    expect(regIds).not.toContain('rec_h1_missing_in_ssr')
    expect(report.recommendations.map(e => e.ruleId)).toEqual(['rec_h1_missing_in_ssr'])
  })

  it('tri par sévérité puis nb de pages décroissant (zéro jargon P0)', () => {
    const pages = (rule: string, severity: ReportAlertInput['severity'], n: number) =>
      Array.from({ length: n }, (_, i) => alert({ ruleId: rule, severity, pageUrl: `https://exemple.fr/${rule}/${i}` }))
    const report = buildZoneReport({
      ...BASE,
      openAlerts: [
        ...pages('h1_missing', 'critical', 2),
        ...pages('noindex_added', 'critical', 5),
        ...pages('h1_multiple', 'warning', 3),
      ],
    })
    expect(report.regressions.critical.map(e => e.ruleId)).toEqual(['noindex_added', 'h1_missing'])
    expect(report.regressions.warning.map(e => e.ruleId)).toEqual(['h1_multiple'])
    expect(JSON.stringify(report)).not.toContain('"P0')
  })

  it('signaturePagesCount : pages distinctes des règles ssr_* et *_in_ssr (hors ssr_blocked)', () => {
    const report = buildZoneReport({
      ...BASE,
      openAlerts: [
        alert({ ruleId: 'ssr_content_mismatch', pageUrl: 'https://exemple.fr/p1' }),
        alert({ ruleId: 'rec_h1_missing_in_ssr', severity: 'warning', pageUrl: 'https://exemple.fr/p1' }), // même page
        alert({ ruleId: 'rec_title_missing_in_ssr', severity: 'warning', pageUrl: 'https://exemple.fr/p2' }),
        alert({ ruleId: 'ssr_blocked', severity: 'warning', pageUrl: 'https://exemple.fr/p3' }), // exclu
        alert({ ruleId: 'h1_missing', pageUrl: 'https://exemple.fr/p4' }), // pas signature
      ],
    })
    expect(report.verdict.signaturePagesCount).toBe(2)
    expect(isSignatureRule('ssr_blocked')).toBe(false)
    expect(isSignatureRule('ssr_title_mismatch')).toBe(true)
    expect(isSignatureRule('rec_img_alt_missing_in_ssr')).toBe(true)
  })

  it('caps : échantillon URLs et « + N autres »', () => {
    const many = Array.from({ length: REPORT_CAPS.SAMPLE_URLS + 7 }, (_, i) =>
      alert({ pageUrl: `https://exemple.fr/page-${String(i).padStart(2, '0')}` }))
    const report = buildZoneReport({ ...BASE, openAlerts: many })
    const entry = report.regressions.critical[0]
    expect(entry.pagesCount).toBe(REPORT_CAPS.SAMPLE_URLS + 7)
    expect(entry.sampleUrls).toHaveLength(REPORT_CAPS.SAMPLE_URLS)
    expect(entry.extraPagesCount).toBe(7)
  })

  it('annexe : pages les plus touchées d abord, cap de règles par page, troncature des preuves', () => {
    const longValue = 'x'.repeat(300)
    const heavyPage = Array.from({ length: REPORT_CAPS.ANNEX_RULES_PER_PAGE + 2 }, (_, i) =>
      alert({ ruleId: `meta_title_changed`, severity: 'warning', pageUrl: 'https://exemple.fr/lourde', message: `m${i}`, previousValue: longValue, currentValue: 'court' }))
    const report = buildZoneReport({
      ...BASE,
      openAlerts: [...heavyPage, alert({ pageUrl: 'https://exemple.fr/legere' })],
    })
    expect(report.annex[0].url).toBe('https://exemple.fr/lourde')
    expect(report.annex[0].alerts).toHaveLength(REPORT_CAPS.ANNEX_RULES_PER_PAGE)
    expect(report.annex[0].extraAlertsCount).toBe(2)
    const proof = report.annex[0].alerts[0].previous!
    expect(proof.length).toBe(REPORT_CAPS.PROOF_CHARS + 1) // 120 + ellipse
    expect(proof.endsWith('…')).toBe(true)
    expect(report.annex[0].alerts[0].current).toBe('court')
  })

  it('annexe : cap de pages + compteur du surplus', () => {
    const many = Array.from({ length: REPORT_CAPS.ANNEX_PAGES + 4 }, (_, i) =>
      alert({ pageUrl: `https://exemple.fr/p-${String(i).padStart(2, '0')}` }))
    const report = buildZoneReport({ ...BASE, openAlerts: many })
    expect(report.annex).toHaveLength(REPORT_CAPS.ANNEX_PAGES)
    expect(report.annexExtraPagesCount).toBe(4)
  })

  it('recommandations : site-level d abord, puis page-level par nb de pages', () => {
    const report = buildZoneReport({
      ...BASE,
      openAlerts: [
        alert({ ruleId: 'rec_img_alt_audit', severity: 'info', pageUrl: 'https://exemple.fr/a' }),
        alert({ ruleId: 'rec_img_alt_audit', severity: 'info', pageUrl: 'https://exemple.fr/b' }),
        alert({ ruleId: 'rec_llms_txt_missing', severity: 'info', pageUrl: 'https://exemple.fr/' }),
      ],
    })
    expect(report.recommendations[0].ruleId).toBe('rec_llms_txt_missing')
    expect(report.recommendations[0].siteLevel).toBe(true)
    expect(report.recommendations[1].ruleId).toBe('rec_img_alt_audit')
  })

  it('réparées : groupées par règle avec compte de pages', () => {
    const report = buildZoneReport({
      ...BASE,
      openAlerts: [],
      repairedAlerts: [
        { ruleId: 'h1_missing', pageUrl: 'https://exemple.fr/a' },
        { ruleId: 'h1_missing', pageUrl: 'https://exemple.fr/b' },
        { ruleId: 'meta_title_missing', pageUrl: 'https://exemple.fr/a' },
      ],
    })
    expect(report.repaired).toEqual([
      { ruleId: 'h1_missing', label: expect.any(String), pagesCount: 2 },
      { ruleId: 'meta_title_missing', label: expect.any(String), pagesCount: 1 },
    ])
  })

  it('zéro régression : statut ok, sections vides mais rapport complet', () => {
    const report = buildZoneReport({
      ...BASE,
      openAlerts: [alert({ ruleId: 'rec_faq_schema_missing', severity: 'info' })],
    })
    expect(report.verdict.status).toBe('ok')
    expect(Object.values(report.regressions).flat()).toHaveLength(0)
    expect(report.recommendations).toHaveLength(1)
  })

  it('zone jamais crawlée : meta cohérente (crawl null)', () => {
    const report = buildZoneReport({ ...BASE, crawl: null, openAlerts: [] })
    expect(report.meta.crawlCompletedAt).toBeNull()
    expect(report.meta.pagesScanned).toBe(0)
  })

  it('chaque entrée porte sa fiche de connaissance', () => {
    const report = buildZoneReport({ ...BASE, openAlerts: [alert({ ruleId: 'noindex_added' })] })
    expect(report.regressions.critical[0].knowledge?.action.length).toBeGreaterThan(10)
  })
})

describe('buildZoneReport — caps exhaustifs (.md)', () => {
  it('MD_REPORT_CAPS : toutes les URLs listées, aucune troncature', async () => {
    const { MD_REPORT_CAPS } = await import('./report-builder')
    const many = Array.from({ length: 250 }, (_, i) =>
      alert({ pageUrl: `https://exemple.fr/p-${String(i).padStart(3, '0')}` }))
    const report = buildZoneReport({ ...BASE, openAlerts: many }, MD_REPORT_CAPS)
    const entry = report.regressions.critical[0]
    expect(entry.sampleUrls).toHaveLength(250) // exhaustif
    expect(entry.extraPagesCount).toBe(0)
    expect(report.annex).toHaveLength(250)
  })
})

describe('purge du monitoring (pagesPurged)', () => {
  it('remonte le compteur dans meta, 0 par defaut', () => {
    const withPurge = buildZoneReport({ ...BASE, openAlerts: [], crawl: { completedAt: '2026-07-02T10:00:00.000Z', pagesScanned: 100, pagesTotal: 100, pagesPurged: 347 } })
    expect(withPurge.meta.pagesPurged).toBe(347)
    const without = buildZoneReport({ ...BASE, openAlerts: [] })
    expect(without.meta.pagesPurged).toBe(0)
  })
})
