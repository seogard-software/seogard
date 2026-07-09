import { MonitoredPage, PageSnapshot } from '../../../../../database/models'

// Série temporelle des métriques de performance d'une page (30 derniers jours),
// pour le graphe d'évolution. Lecture seule, viewer+.
export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  await requireSiteAccess(event, siteId, 'viewer')

  const pageId = requireValidId(event, 'pageId')

  // Vérifie que la page appartient bien au site.
  const page = await MonitoredPage.findOne({ _id: pageId, siteId }).select('url lastPerf').lean()
  if (!page) {
    throw createError({ statusCode: 404, message: 'Page not found', data: { errorCode: 'PAGE_NOT_FOUND' } })
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const snapshots = await PageSnapshot.find({
    pageId,
    createdAt: { $gte: since },
    perf: { $ne: null },
  })
    .sort({ createdAt: 1 })
    .select('createdAt perf')
    .lean()

  const history = snapshots.map(s => ({ date: s.createdAt, perf: s.perf }))

  return { url: (page as { url: string }).url, current: (page as { lastPerf: unknown }).lastPerf, history }
})
