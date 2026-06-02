import { Crawl } from '../server/database/models'

// Décisions de complétude / blocage d'un crawl distribué, isolées et testables.
// Règle d'or : un crawl n'est PAS « terminé » parce que la file Redis est vide — elle se
// vide au pop (avant traitement). Il est terminé quand toutes les pages ont été ANALYSÉES,
// donc quand toutes les alertes sont écrites (`scanned` est incrémenté APRÈS les upserts).

export interface CrawlProgressSnapshot {
  total: number
  scanned: number
  dequeued: number
  lastProgressAt: number
}

const STATUS_TERMINAL = ['completed', 'failed', 'cancelled']

/**
 * Crawl réellement terminé : toutes les pages dépilées ont été analysées (alertes écrites).
 */
export function isCrawlComplete(p: { total: number, scanned: number }): boolean {
  return p.total > 0 && p.scanned >= p.total
}

/**
 * Crawl bloqué par un worker mort : toutes les pages ont été dépilées (`dequeued`), mais
 * l'analyse reste coincée sous le total et n'a pas progressé depuis `staleMs`. Le watchdog
 * clôture alors quand même (via le claim atomique → sûr). Jamais vrai en marche normale.
 */
export function isCrawlStalled(p: CrawlProgressSnapshot, now: number, staleMs: number): boolean {
  return p.total > 0
    && p.dequeued >= p.total
    && p.scanned < p.total
    && p.lastProgressAt > 0
    && (now - p.lastProgressAt) > staleMs
}

/**
 * Réclame la finalisation de façon atomique (exactly-once). Le `findOneAndUpdate` ne matche
 * que si le statut n'est pas déjà terminal : un seul worker gagne, les autres reçoivent
 * `null` et s'arrêtent. Robuste au cancel-and-restart (un crawl annulé/échoué n'est jamais
 * re-finalisé). Renvoie true si CE worker doit exécuter la finalisation.
 */
export async function claimCrawlFinalization(
  crawlId: string,
  finalCounts: { scanned: number, alerts: number, blocked: number, failed: number },
): Promise<boolean> {
  const claimed = await Crawl.findOneAndUpdate(
    { _id: crawlId, status: { $nin: STATUS_TERMINAL } },
    {
      $set: {
        status: 'completed',
        completedAt: new Date(),
        pagesScanned: finalCounts.scanned,
        alertsGenerated: finalCounts.alerts,
        pagesBlocked: finalCounts.blocked,
        pagesFailed: finalCounts.failed,
      },
    },
    { new: true },
  )
  return claimed !== null
}
