import { rankRecommendations, type TopReco } from './recommendations'

// Construit le contenu de l'email de fin de crawl à partir des alertes du crawl + des
// régressions réparées. Pur et testable : décide aussi SI on envoie (monitoring-first).

export interface ReportAlert {
  pageUrl: string
  ruleId: string
  category: string
  severity: string
  message: string
}

export interface CrawlReport {
  shouldSend: boolean
  regressions: { pageUrl: string, severity: string, message: string }[]
  fixed: { pageUrl: string, message: string }[]
  topRecos: TopReco[]
  recoCount: number
}

// Monitoring = toute régression : event (quelque chose a changé/cassé/disparu) ou state
// (problème présent). La SÉVÉRITÉ ne filtre PAS : une régression info reste une régression et
// doit notifier — c'est la promesse du monitoring. Seules les recommandations (audit) sont
// exclues (par catégorie). Les règles event ne fire qu'à la transition → pas de spam.
function isMonitoring(a: ReportAlert): boolean {
  return a.category === 'event' || a.category === 'state'
}

/**
 * `fixedAlerts` = régressions event/state réparées DANS ce crawl (déjà filtrées en amont).
 * On n'envoie le mail QUE s'il y a au moins une nouvelle régression OU une réparation : les
 * recommandations (audit) ne déclenchent jamais le mail et ne sont pas listées (juste résumées).
 */
export function buildCrawlReport(allAlerts: ReportAlert[], fixedAlerts: ReportAlert[]): CrawlReport {
  const regressions = allAlerts.filter(isMonitoring)
  const recos = allAlerts.filter(a => a.category === 'recommendation')
  const { topRecos, recoCount } = rankRecommendations(
    recos.map(a => ({ ruleId: a.ruleId, pageUrl: a.pageUrl, severity: a.severity })),
  )

  return {
    shouldSend: regressions.length > 0 || fixedAlerts.length > 0,
    regressions: regressions.map(a => ({ pageUrl: a.pageUrl, severity: a.severity, message: a.message })),
    fixed: fixedAlerts.map(a => ({ pageUrl: a.pageUrl, message: a.message })),
    topRecos,
    recoCount,
  }
}
