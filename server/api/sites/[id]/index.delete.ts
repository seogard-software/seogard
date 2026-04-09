import { Site, MonitoredPage, Crawl, Alert, PageSnapshot } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.sites')
  const id = requireValidId(event)
  await requireSiteAccess(event, id, 'admin')

  const site = await Site.findOneAndDelete({ _id: id }).lean()

  if (!site) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  // Cascade delete related documents
  const pages = await MonitoredPage.find({ siteId: id }).select('_id').lean()
  const pageIds = pages.map(p => p._id)

  await Promise.all([
    Alert.deleteMany({ siteId: id }),
    Crawl.deleteMany({ siteId: id }),
    MonitoredPage.deleteMany({ siteId: id }),
    pageIds.length > 0 ? PageSnapshot.deleteMany({ pageId: { $in: pageIds } }) : Promise.resolve(),
  ])

  log.info({ siteId: id, siteName: site.name }, 'site deleted')

  return { success: true }
})
