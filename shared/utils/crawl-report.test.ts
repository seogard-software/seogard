import { describe, expect, it } from 'vitest'
import { buildCrawlReport, type ReportAlert } from './crawl-report'

const a = (category: string, severity: string, message = 'msg', pageUrl = '/p', ruleId = 'r'): ReportAlert =>
  ({ category, severity, message, pageUrl, ruleId })

describe('buildCrawlReport — déclencheur monitoring-first', () => {
  it('≥1 régression (event/state crit/warning) → shouldSend', () => {
    expect(buildCrawlReport([a('event', 'critical')], []).shouldSend).toBe(true)
    expect(buildCrawlReport([a('state', 'warning')], []).shouldSend).toBe(true)
  })

  it('≥1 réparée seule (aucune nouvelle régression) → shouldSend', () => {
    const r = buildCrawlReport([], [a('event', 'critical', 'réparé')])
    expect(r.shouldSend).toBe(true)
    expect(r.regressions).toHaveLength(0)
    expect(r.fixed).toHaveLength(1)
  })

  it('recommandations SEULES → PAS d\'envoi', () => {
    const r = buildCrawlReport([a('recommendation', 'info'), a('recommendation', 'warning')], [])
    expect(r.shouldSend).toBe(false)
    expect(r.regressions).toHaveLength(0)
    expect(r.recoCount).toBe(2)
  })

  it('sortie de sitemap SEULE (aucune régression/réparation) → shouldSend + portée dans le rapport', () => {
    const r = buildCrawlReport([], [], { count: 12, nonOkCount: 3 })
    expect(r.shouldSend).toBe(true)
    expect(r.sitemapRemoved).toEqual({ count: 12, nonOkCount: 3 })
    expect(r.regressions).toHaveLength(0)
  })

  it('recos + sortie sitemap null → PAS d\'envoi (sitemap ne force pas à lui seul sans nouveauté)', () => {
    const r = buildCrawlReport([a('recommendation', 'info')], [], null)
    expect(r.shouldSend).toBe(false)
    expect(r.sitemapRemoved).toBeNull()
  })

  it('aucune alerte → PAS d\'envoi', () => {
    expect(buildCrawlReport([], []).shouldSend).toBe(false)
  })

  it('les recommandations ne comptent jamais comme régressions', () => {
    const r = buildCrawlReport(
      [a('event', 'critical'), a('recommendation', 'warning'), a('recommendation', 'info')],
      [],
    )
    expect(r.regressions).toHaveLength(1)
    expect(r.recoCount).toBe(2)
  })

  it('une régression info (event/state) DÉCLENCHE — toute régression notifie, quelle que soit la sévérité', () => {
    expect(buildCrawlReport([a('event', 'info')], []).shouldSend).toBe(true)
    expect(buildCrawlReport([a('state', 'info')], []).shouldSend).toBe(true)
  })
})
