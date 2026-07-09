import { Types } from 'mongoose'
import { Zone, CrawlReport } from '../database/models'
import { getObjectSignedUrl } from './object-storage'
import type { CrawlActivityVerdict, CrawlTimelineEntry, ZoneCrawlHistory } from '../../shared/types/zone-report'
import type { Locale } from '../../shared/utils/i18n'
import { DEFAULT_LOCALE } from '../../shared/utils/i18n'
import { t } from './i18n'

// Couche DB de la page rapport : historique des crawls (snapshots) + URL de téléchargement.
// Les fichiers .md/.pdf vivent dans le stockage objet (R2/S3) ; écrits par le crawler.

/** Nb de crawls affichés dans l'historique (les plus récents). */
export const HISTORY_DISPLAY_LIMIT = 30

/** Historique des crawls de la zone (liste des snapshots) — alimente la page. */
export async function loadZoneCrawlHistory(siteId: string, zoneId: string, locale: Locale = DEFAULT_LOCALE): Promise<ZoneCrawlHistory> {
  const zone = await Zone.findOne({ _id: zoneId, siteId }).select('name isDefault').lean()
  if (!zone) throw createError({ statusCode: 404, message: 'Zone introuvable' })
  const zoneName = zone.isDefault ? t(locale, 'report.zone_default') : (zone.name ?? t(locale, 'report.zone_unnamed'))

  const snapshots = await CrawlReport.find({ siteId: new Types.ObjectId(siteId), zoneId: new Types.ObjectId(zoneId) })
    .sort({ completedAt: -1 })
    .limit(HISTORY_DISPLAY_LIMIT)
    .select('crawlId completedAt pagesScanned regressions fixed verdict')
    .lean()

  const timeline: CrawlTimelineEntry[] = snapshots.map(s => ({
    crawlId: s.crawlId.toString(),
    completedAt: s.completedAt ? new Date(s.completedAt).toISOString() : null,
    status: 'completed',
    pagesScanned: s.pagesScanned ?? 0,
    regressions: s.regressions ?? 0,
    fixed: s.fixed ?? 0,
    verdict: (s.verdict ?? 'stable') as CrawlActivityVerdict,
  }))

  return { zoneName, timeline }
}

/** URL signée de téléchargement du rapport figé d'un crawl (.md ou .pdf), depuis le stockage objet. */
export async function getCrawlReportSignedUrl(siteId: string, zoneId: string, crawlId: string, format: 'md' | 'pdf'): Promise<string> {
  if (!Types.ObjectId.isValid(crawlId)) throw createError({ statusCode: 400, message: 'crawlId invalide' })
  const snap = await CrawlReport.findOne({
    crawlId: new Types.ObjectId(crawlId),
    siteId: new Types.ObjectId(siteId),
    zoneId: new Types.ObjectId(zoneId),
  }).select('mdKey pdfKey').lean() as { mdKey: string, pdfKey: string } | null
  if (!snap) throw createError({ statusCode: 404, message: 'Rapport de crawl introuvable' })

  const key = format === 'md' ? snap.mdKey : snap.pdfKey
  try {
    return await getObjectSignedUrl(key)
  }
  catch {
    throw createError({ statusCode: 503, message: 'Stockage des rapports indisponible' })
  }
}
