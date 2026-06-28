import { Types } from 'mongoose'
import { Site, Zone, Crawl, Alert, CrawlReport } from '../server/database/models'
import { alertZoneScopeStages } from '../server/utils/zone-alert-scope'
import { buildZoneReport, MD_REPORT_CAPS, REPORT_RETENTION_DAYS, type ReportAlertInput } from '../server/utils/report-builder'
import { renderReportMarkdown } from '../server/utils/report-markdown'
import { renderReportPdf } from '../server/utils/report-pdf'
import { crawlReportStorageKey, reportFilename } from '../shared/utils/report-links'
import { putObject, deleteObjects, isObjectStorageEnabled } from '../server/utils/object-storage'
import type { CrawlActivityVerdict } from '../shared/types/zone-report'
import { createLogger } from '../server/utils/logger'

const log = createLogger('crawler', 'crawl-snapshot')

// Garde-fou MÉMOIRE : plafond d'alertes lues pour construire le rapport. À 100 000 le pic mémoire
// reste ~230 Mo (sûr sur un worker 1 Go), tout en couvrant n'importe quel site réaliste (500-50K
// pages, même avec une régression sur tout le site). Au-delà : .md tronqué + warn loggé.
const FETCH_CEILING = 100_000

/** Verdict d'activité d'un crawl = sévérité max des régressions signalées ce crawl (PUR, testé). */
export function activityVerdict(critical: number, warning: number, total: number): CrawlActivityVerdict {
  if (critical > 0) return 'critical'
  if (warning > 0) return 'warning'
  if (total > 0) return 'info'
  return 'stable'
}

export interface SnapshotResult { pdf: Buffer, pdfFilename: string }

/**
 * Génère le rapport figé d'un crawl terminé (.md EXHAUSTIF + .pdf COURT), l'uploade dans le
 * stockage objet (R2/S3), ne garde en Mongo que les clés + compteurs, et purge les rapports de
 * plus de REPORT_RETENTION_DAYS. Retourne le PDF (pour le joindre à l'email) ou null.
 *
 * À appeler APRÈS l'auto-resolve et DANS le bloc claim exactly-once de finalizeCrawl.
 * No-op si le stockage objet n'est pas configuré (feature off, ex. self-hosted sans S3).
 */
export async function writeCrawlSnapshot(crawlId: string, siteId: string): Promise<SnapshotResult | null> {
  if (!isObjectStorageEnabled()) return null

  const crawl = await Crawl.findById(crawlId).select('zoneId completedAt pagesScanned pagesTotal').lean()
  if (!crawl?.zoneId) return null
  const zone = await Zone.findById(crawl.zoneId).lean()
  if (!zone) return null
  const site = await Site.findById(siteId).select('name url sitemapRemoved').lean()
  if (!site) return null

  const sid = new Types.ObjectId(siteId)
  const zid = crawl.zoneId
  const scope = alertZoneScopeStages(zone)

  const [openAlerts, repairedAlerts, regBySev, fixed] = await Promise.all([
    Alert.aggregate([
      { $match: { siteId: sid, status: 'open' } },
      ...scope,
      { $limit: FETCH_CEILING },
      { $project: { _id: 0, ruleId: 1, pageUrl: 1, severity: 1, message: 1, previousValue: 1, currentValue: 1 } },
    ]) as Promise<ReportAlertInput[]>,
    Alert.aggregate([
      { $match: { siteId: sid, resolvedCrawlId: crawl._id } },
      ...scope,
      { $limit: FETCH_CEILING },
      { $project: { _id: 0, ruleId: 1, pageUrl: 1 } },
    ]) as Promise<{ ruleId: string, pageUrl: string }[]>,
    Alert.aggregate([
      { $match: { siteId: sid, category: { $in: ['event', 'state'] }, lastCrawlId: crawl._id } },
      { $group: { _id: '$severity', n: { $sum: 1 } } },
    ]) as Promise<{ _id: string, n: number }[]>,
    Alert.countDocuments({ siteId: sid, status: 'resolved', resolvedCrawlId: crawl._id, category: { $in: ['event', 'state'] } }),
  ])

  if (openAlerts.length >= FETCH_CEILING) {
    log.warn({ crawlId, siteId, ceiling: FETCH_CEILING }, 'snapshot fetch ceiling reached — report may be truncated')
  }

  let critical = 0, warning = 0, total = 0
  for (const r of regBySev) {
    if (r._id === 'critical') critical += r.n
    else if (r._id === 'warning') warning += r.n
    total += r.n
  }

  let domain = site.url ?? ''
  try { domain = new URL(domain).hostname } catch { /* garde l'URL brute si invalide */ }

  // Un seul rapport exhaustif → rend le .md (tout) et le .pdf (le rendu PDF compacte de lui-même).
  const report = buildZoneReport({
    site: { name: site.name, domain },
    zone: { name: zone.name ?? null, isDefault: !!zone.isDefault },
    crawl: {
      completedAt: crawl.completedAt ? new Date(crawl.completedAt).toISOString() : null,
      pagesScanned: crawl.pagesScanned ?? 0,
      pagesTotal: crawl.pagesTotal ?? 0,
    },
    openAlerts,
    repairedAlerts,
    generatedAt: new Date().toISOString(),
    sitemapRemoved: site.sitemapRemoved?.count
      ? { count: site.sitemapRemoved.count, nonOkCount: site.sitemapRemoved.nonOkCount ?? 0 }
      : null,
  }, MD_REPORT_CAPS)

  const md = renderReportMarkdown(report)
  const pdf = await renderReportPdf(report)
  const mdFilename = reportFilename(report, 'md')
  const pdfFilename = reportFilename(report, 'pdf')
  const mdKey = crawlReportStorageKey(siteId, zid.toString(), crawl._id.toString(), 'md')
  const pdfKey = crawlReportStorageKey(siteId, zid.toString(), crawl._id.toString(), 'pdf')

  await Promise.all([
    putObject(mdKey, md, 'text/markdown; charset=utf-8', `attachment; filename="${mdFilename}"`),
    putObject(pdfKey, pdf, 'application/pdf', `attachment; filename="${pdfFilename}"`),
  ])

  await CrawlReport.updateOne(
    { crawlId: crawl._id },
    {
      $set: {
        siteId: sid,
        zoneId: zid,
        completedAt: crawl.completedAt ?? new Date(),
        pagesScanned: crawl.pagesScanned ?? 0,
        regressions: total,
        fixed,
        verdict: activityVerdict(critical, warning, total),
        mdKey,
        pdfKey,
      },
    },
    { upsert: true },
  )

  // Purge par âge : rapports de plus de REPORT_RETENTION_DAYS (doc Mongo + fichiers R2).
  const cutoff = new Date(Date.now() - REPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const stale = await CrawlReport.find({ siteId: sid, zoneId: zid, completedAt: { $lt: cutoff } })
    .select('_id mdKey pdfKey').lean() as { _id: Types.ObjectId, mdKey: string, pdfKey: string }[]
  if (stale.length > 0) {
    await deleteObjects(stale.flatMap(s => [s.mdKey, s.pdfKey]))
    await CrawlReport.deleteMany({ _id: { $in: stale.map(s => s._id) } })
    log.info({ crawlId, zoneId: zid.toString(), purged: stale.length }, 'old crawl reports purged (>90j)')
  }

  return { pdf, pdfFilename }
}
