import { Zone, Crawl } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId requis' })
  }

  await requireZoneAccess(event, siteId, zoneId, 'viewer')

  const zone = await Zone.findOne({ _id: zoneId, siteId }).lean()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone introuvable' })
  }

  const crawl = await Crawl.findOne({
    siteId,
    zoneId: zone._id,
    status: { $in: ['pending', 'running'] },
  }).sort({ createdAt: -1 }).lean()

  if (!crawl) return null

  // alertsGenerated est mis a jour par les workers toutes les 10s (syncProgress)
  return crawl
})
