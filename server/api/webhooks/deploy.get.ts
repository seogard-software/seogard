import { Site, Crawl, Alert } from '../../database/models'

export default defineEventHandler(async (event) => {
  const apiKey = getHeader(event, 'x-api-key')

  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'API key requise' })
  }

  const site = await Site.findOne({ apiKey }).select('_id ciStrictness').lean()

  if (!site) {
    throw createError({ statusCode: 401, message: 'API key invalide' })
  }

  const query = getQuery(event)
  const crawlId = query.crawlId as string

  if (!crawlId) {
    throw createError({ statusCode: 400, message: 'crawlId requis' })
  }

  const crawl = await Crawl.findOne({ _id: crawlId, siteId: site._id })
    .select('status pagesScanned pagesTotal alertsGenerated startedAt completedAt error')
    .lean()

  if (!crawl) {
    throw createError({ statusCode: 404, message: 'Crawl non trouvé' })
  }

  // Crawl still in progress
  if (crawl.status === 'pending' || crawl.status === 'running') {
    return {
      status: crawl.status,
      pass: null,
      progress: {
        pagesScanned: crawl.pagesScanned,
        pagesTotal: crawl.pagesTotal,
      },
      alerts: null,
      message: crawl.status === 'pending' ? 'Crawl en attente' : 'Crawl en cours',
    }
  }

  // Crawl failed or cancelled
  if (crawl.status === 'failed' || crawl.status === 'cancelled') {
    return {
      status: crawl.status,
      pass: null,
      progress: null,
      alerts: null,
      message: crawl.error || `Crawl ${crawl.status}`,
    }
  }

  // Crawl completed — compute verdict
  const [critical, warning, info] = await Promise.all([
    Alert.countDocuments({ siteId: site._id, lastCrawlId: crawlId, severity: 'critical' }),
    Alert.countDocuments({ siteId: site._id, lastCrawlId: crawlId, severity: 'warning' }),
    Alert.countDocuments({ siteId: site._id, lastCrawlId: crawlId, severity: 'info' }),
  ])

  const strictness = (site as any).ciStrictness || 'standard'

  let pass: boolean
  let message: string

  switch (strictness) {
    case 'strict':
      pass = critical === 0 && warning === 0
      message = pass
        ? 'Aucune alerte détectée'
        : `${critical} critique(s), ${warning} warning(s)`
      break
    case 'relaxed':
      pass = critical < 5
      message = pass
        ? `${critical} alerte(s) critique(s) (seuil : 5)`
        : `${critical} alerte(s) critique(s) — seuil de 5 dépassé`
      break
    default: // standard
      pass = critical === 0
      message = pass
        ? 'Aucune régression critique détectée'
        : `${critical} alerte(s) critique(s) détectée(s)`
  }

  return {
    status: 'completed',
    pass,
    strictness,
    progress: {
      pagesScanned: crawl.pagesScanned,
      pagesTotal: crawl.pagesTotal,
    },
    alerts: { critical, warning, info, total: critical + warning + info },
    message,
  }
})
