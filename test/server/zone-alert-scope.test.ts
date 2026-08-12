import { describe, it, expect } from 'vitest'
import { alertZoneScopeStages } from '../../server/utils/zone-alert-scope'
import { SITE_LEVEL_RULE_IDS } from '../../shared/utils/rules-catalog'

/**
 * Les règles site-level sont ancrées sur l'URL RACINE du site par convention. Les filtrer par
 * pathname les ferait disparaître de toute zone qui ne contient pas la racine — alors qu'elles
 * décrivent le site entier. Le cas qui rend le défaut visible :
 * `crawl_coverage_incomplete` compte dans le verdict CI d'une zone (filtre sur lastCrawlId,
 * pas sur la zone) ; sans exemption, elle bloquerait un déploiement sans figurer dans le
 * rapport de cette zone.
 */
describe('scoping des alertes par zone', () => {
  const zoneCustom = { isDefault: false, patterns: ['/produits/**'], _patternsRegex: '^/produits/' }

  it('la zone par défaut ne filtre rien', () => {
    const stages = alertZoneScopeStages({ isDefault: true })
    expect(stages).toHaveLength(1) // extraction du pathname seule
  })

  it('une zone custom filtre sur le pathname', () => {
    const [, match] = alertZoneScopeStages(zoneCustom) as [unknown, { $match: { $or: unknown[] } }]
    const parPathname = match.$match.$or.find((c: unknown) => '_alertPathname' in (c as object))
    expect(parPathname).toEqual({ _alertPathname: { $regex: '^/produits/' } })
  })

  it('les règles site-level échappent au filtre de zone', () => {
    const [, match] = alertZoneScopeStages(zoneCustom) as [unknown, { $match: { $or: { ruleId?: { $in: string[] } }[] } }]
    const parRegle = match.$match.$or.find(c => c.ruleId)
    expect(parRegle?.ruleId?.$in).toContain('crawl_coverage_incomplete')
    expect(parRegle?.ruleId?.$in).toContain('llms_txt_removed')
  })

  it('la couverture de crawl est bien déclarée site-level', () => {
    // Si la règle repassait en `within-crawl`, elle sortirait de l'exemption sans bruit :
    // ce test est le garde-fou.
    expect(SITE_LEVEL_RULE_IDS.has('crawl_coverage_incomplete')).toBe(true)
  })
})
