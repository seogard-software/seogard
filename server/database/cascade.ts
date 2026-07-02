import type { Types } from 'mongoose'
import { MonitoredPage, Alert, Crawl, Zone, CrawlSchedule, MutedRule, CrawlReport, PageSnapshot } from './models'
import { deleteObjects } from '../utils/object-storage'
import { createLogger } from '../utils/logger'

const log = createLogger('database', 'cascade')

// Suppression en cascade — source de vérité UNIQUE (registres + implémentations), verrouillée
// par le test-tripwire `test/server/cascade.test.ts` : il introspecte TOUS les schémas Mongoose
// et échoue au build si un modèle référence un Site ou une page sans figurer ici.
//
// Ajouter une collection liée à un site ou une page =
//   1. décider : supprimée en cascade (…_DELETE) ou conservée volontairement (…_EXEMPT + raison) ;
//   2. si DELETE : ajouter le deleteMany dans la fonction de cascade correspondante ci-dessous.

/** Supprimés quand un SITE est supprimé — implémentation : `deleteSitesCascade()`. */
export const SITE_CASCADE_DELETE = [
  'MonitoredPage',
  'Alert',
  'Crawl',
  'Zone',
  'CrawlSchedule',
  'MutedRule',
  'CrawlReport',
] as const

/** Référencent un site mais VOLONTAIREMENT conservés à sa suppression (raison obligatoire). */
export const SITE_CASCADE_EXEMPT: Record<string, string> = {
  EmailLog: 'journal d envoi (trace d audit des emails) — siteId nullable, le log survit au site',
}

/** Supprimés quand une PAGE sort du monitoring — implémentation : `deletePagesCascade()`. */
export const PAGE_CASCADE_DELETE = [
  'PageSnapshot', // par pageId
  'Alert', // par pageUrl (pas de ref : l URL est la clé)
] as const

/** Référencent une page mais volontairement conservés (aucun à ce jour). */
export const PAGE_CASCADE_EXEMPT: Record<string, string> = {}

type Id = Types.ObjectId | string

/**
 * Supprime tout ce qui appartient aux sites donnés (les documents Site eux-mêmes restent à la
 * charge de l'appelant). Utilisée par le delete de site (1 id) et le delete d'org (n ids).
 * Les pageIds sont lus AVANT la suppression des MonitoredPage (sinon les snapshots, liés par
 * pageId, deviendraient introuvables).
 */
export async function deleteSitesCascade(siteIds: Id[]): Promise<void> {
  if (siteIds.length === 0) return
  const pages = await MonitoredPage.find({ siteId: { $in: siteIds } }).select('_id').lean()
  const pageIds = pages.map(p => p._id)

  // Fichiers R2 des rapports figés : les clés vivent dans les lignes CrawlReport — les lire
  // AVANT le deleteMany, sinon les objets deviennent introuvables à jamais (la purge de
  // rétention 90 j s'appuie sur ces lignes). Échec R2 (storage down) → on log et on continue :
  // la suppression du site ne doit pas échouer pour un stockage d'archives indisponible.
  const reports = await CrawlReport.find({ siteId: { $in: siteIds } }).select('mdKey pdfKey').lean()
  if (reports.length > 0) {
    try {
      await deleteObjects(reports.flatMap(r => [r.mdKey, r.pdfKey]).filter((k): k is string => !!k))
    }
    catch (error) {
      log.error({ siteCount: siteIds.length, reportCount: reports.length, error: (error as Error).message }, 'R2 report objects deletion failed during site cascade — objects may be orphaned')
    }
  }

  await Promise.all([
    MonitoredPage.deleteMany({ siteId: { $in: siteIds } }),
    Alert.deleteMany({ siteId: { $in: siteIds } }),
    Crawl.deleteMany({ siteId: { $in: siteIds } }),
    Zone.deleteMany({ siteId: { $in: siteIds } }),
    CrawlSchedule.deleteMany({ siteId: { $in: siteIds } }),
    MutedRule.deleteMany({ siteId: { $in: siteIds } }),
    CrawlReport.deleteMany({ siteId: { $in: siteIds } }),
    pageIds.length > 0 ? PageSnapshot.deleteMany({ pageId: { $in: pageIds } }) : Promise.resolve(),
  ])
}

/**
 * Supprime des pages précises d'un site + leurs données liées. Utilisée par la purge de fin
 * de crawl (retraits 410 digérés) — et par tout futur chemin de sortie du monitoring.
 */
export async function deletePagesCascade(siteId: Id, pages: { _id: Id, url: string }[]): Promise<void> {
  if (pages.length === 0) return
  const pageIds = pages.map(p => p._id)
  const pageUrls = pages.map(p => p.url)

  await PageSnapshot.deleteMany({ pageId: { $in: pageIds } })
  await Alert.deleteMany({ siteId, pageUrl: { $in: pageUrls } })
  await MonitoredPage.deleteMany({ _id: { $in: pageIds } })
}
