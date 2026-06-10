import mongoose from 'mongoose'
import { Zone, Crawl, Alert } from '~~/server/database/models'
import { computeCiVerdict } from '~~/shared/utils/ci-verdict'
import { requireZoneCrawlAccess } from '~~/server/utils/zone-ci-auth'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  // ObjectId validé → un zoneId malformé (typo CI) répond 400, pas un CastError 500.
  const zoneId = requireValidId(event, 'zoneId')

  // CI (clé API du site) OU dashboard (session).
  await requireZoneCrawlAccess(event, siteId, zoneId, 'viewer')

  const zone = await Zone.findOne({ _id: zoneId, siteId }).lean()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone introuvable' })
  }

  const crawlId = getQuery(event).crawlId as string | undefined
  if (crawlId && !mongoose.Types.ObjectId.isValid(crawlId)) {
    throw createError({ statusCode: 400, message: 'crawlId invalide' })
  }

  // Sans crawlId → dernier crawl en cours de la zone (progression dashboard).
  // alertsGenerated est mis à jour par les workers toutes les 10s (syncProgress).
  if (!crawlId) {
    const inFlight = await Crawl.findOne({
      siteId,
      zoneId: zone._id,
      status: { $in: ['pending', 'running'] },
    }).sort({ createdAt: -1 }).lean()
    return inFlight ?? null
  }

  // Avec crawlId → status + verdict CI (alertes scopées au crawl = à la zone).
  const crawl = await Crawl.findOne({ _id: crawlId, siteId, zoneId: zone._id })
    .select('status pagesScanned pagesTotal error')
    .lean()
  if (!crawl) {
    throw createError({ statusCode: 404, message: 'Crawl non trouvé' })
  }

  if (crawl.status === 'pending' || crawl.status === 'running') {
    return {
      status: crawl.status,
      pass: null,
      progress: { pagesScanned: crawl.pagesScanned, pagesTotal: crawl.pagesTotal },
      alerts: null,
      message: crawl.status === 'pending' ? 'Crawl en attente' : 'Crawl en cours',
    }
  }

  if (crawl.status === 'failed' || crawl.status === 'cancelled') {
    return { status: crawl.status, pass: null, progress: null, alerts: null, message: crawl.error || `Crawl ${crawl.status}` }
  }

  // completed → verdict selon la strictness de la ZONE, sur les RÉGRESSIONS uniquement
  // (event/state ; les recommandations `rec_*` re-firent à chaque crawl → en strict, un audit
  // warning permanent bloquerait CHAQUE deploy à vie. Un gate CI juge ce que le deploy a cassé,
  // pas l'audit). Les règles mutées ne créent pas d'alerte (filtrées par le crawler) ; une règle
  // mutée APRÈS un crawl nécessite de relancer un crawl pour débloquer le verdict.
  const verdictFilter = {
    siteId,
    lastCrawlId: crawlId,
    category: { $in: ['event', 'state'] },
  }
  const [critical, warning, info] = await Promise.all([
    Alert.countDocuments({ ...verdictFilter, severity: 'critical' }),
    Alert.countDocuments({ ...verdictFilter, severity: 'warning' }),
    Alert.countDocuments({ ...verdictFilter, severity: 'info' }),
  ])

  const strictness = (zone as any).ciStrictness || 'standard'
  const { pass, message } = computeCiVerdict(strictness, { critical, warning, info })

  return {
    status: 'completed',
    pass,
    strictness,
    progress: { pagesScanned: crawl.pagesScanned, pagesTotal: crawl.pagesTotal },
    alerts: { critical, warning, info, total: critical + warning + info },
    message,
  }
})
