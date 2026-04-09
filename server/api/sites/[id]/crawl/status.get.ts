import { Crawl } from '../../../../database/models'

export default defineEventHandler(async (event) => {
  const id = requireValidId(event)
  await requireSiteAccess(event, id, 'viewer')

  const crawl = await Crawl.findOne({
    siteId: id,
    status: { $in: ['pending', 'running'] },
  }).sort({ createdAt: -1 }).lean()

  if (!crawl) return null

  // alertsGenerated est mis a jour par les workers toutes les 10s (syncProgress)
  // Pas de countDocuments en live — evite les slow queries de 300-1400ms
  return crawl
})
