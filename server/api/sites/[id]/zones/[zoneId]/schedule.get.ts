import { CrawlSchedule } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId required', data: { errorCode: 'ZONE_ID_REQUIRED' } })
  }

  await requireZoneAccess(event, siteId, zoneId, 'admin')

  const schedule = await CrawlSchedule.findOne({ zoneId, siteId }).lean()
  return { schedule: schedule ?? null }
})
