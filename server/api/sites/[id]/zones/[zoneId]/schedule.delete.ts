import { CrawlSchedule } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId required', data: { errorCode: 'ZONE_ID_REQUIRED' } })
  }

  await requireZoneAccess(event, siteId, zoneId, 'admin')

  // Soft delete: disable + clear next slot. Keep the row so the user can
  // re-enable with their previous frequency/hour preserved.
  await CrawlSchedule.updateOne(
    { zoneId, siteId },
    { $set: { enabled: false, nextCrawlAt: null } },
  )

  return { disabled: true }
})
