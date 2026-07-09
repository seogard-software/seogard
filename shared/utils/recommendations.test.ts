import { describe, expect, it } from 'vitest'
import { rankRecommendations } from './recommendations'

const page = (ruleId: string, pageUrl: string, severity = 'info') => ({ ruleId, pageUrl, severity })

describe('rankRecommendations', () => {
  it('groupe par ruleId et compte les pages DISTINCTES (recoCount = total alertes)', () => {
    const { topRecos, recoCount } = rankRecommendations([
      page('rec_title_length_audit', '/a'),
      page('rec_title_length_audit', '/b'),
      page('rec_title_length_audit', '/a'), // doublon page → ne recompte pas
    ])
    expect(recoCount).toBe(3)
    expect(topRecos[0]!.ruleId).toBe('rec_title_length_audit')
    expect(topRecos[0]!.pagesAffected).toBe(2)
  })

  it('site-level (llms.txt, 1 page) passe DEVANT un page-level très répandu (340 pages)', () => {
    const recos = [
      ...Array.from({ length: 340 }, (_, i) => page('rec_title_length_audit', `/p${i}`)),
      page('rec_llms_txt_missing', '/'),
    ]
    const { topRecos } = rankRecommendations(recos)
    expect(topRecos[0]!.ruleId).toBe('rec_llms_txt_missing')
    expect(topRecos[0]!.siteLevel).toBe(true)
    expect(topRecos[0]!.hint).toBeNull() // hint résolu PAR LOCALE au rendu email (emails.recoHints)
    expect(topRecos[1]!.ruleId).toBe('rec_title_length_audit')
    expect(topRecos[1]!.pagesAffected).toBe(340)
  })

  it('page-level classés par reach (nb de pages) décroissant', () => {
    const { topRecos } = rankRecommendations([
      page('rec_img_alt_audit', '/a'),
      page('rec_internal_links_audit', '/a'),
      page('rec_internal_links_audit', '/b'),
    ])
    expect(topRecos[0]!.ruleId).toBe('rec_internal_links_audit') // 2 pages
    expect(topRecos[1]!.ruleId).toBe('rec_img_alt_audit') // 1 page
  })

  it('égalité de reach → warning avant info', () => {
    const { topRecos } = rankRecommendations([
      page('rec_img_alt_audit', '/a', 'info'),
      page('rec_perf_page_heavy', '/a', 'warning'),
    ])
    expect(topRecos[0]!.ruleId).toBe('rec_perf_page_heavy')
  })

  it('respecte la limite (top 2 par défaut)', () => {
    const { topRecos } = rankRecommendations([
      page('rec_img_alt_audit', '/a'),
      page('rec_internal_links_audit', '/a'),
      page('rec_title_length_audit', '/a'),
    ])
    expect(topRecos).toHaveLength(2)
  })

  it('libellé humain depuis ALERT_TYPE_LABELS', () => {
    const { topRecos } = rankRecommendations([page('rec_llms_txt_missing', '/')])
    expect(topRecos[0]!.label).toBe('/llms.txt manquant')
  })
})
