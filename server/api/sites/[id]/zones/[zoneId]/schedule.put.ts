import { CrawlSchedule, Zone } from '~~/server/database/models'
import { computeNextCrawlAt, validateSchedule, type CrawlScheduleConfig } from '~~/shared/utils/crawl-schedule'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId required', data: { errorCode: 'ZONE_ID_REQUIRED' } })
  }

  await requireZoneAccess(event, siteId, zoneId, 'admin')

  const body = (await readBody(event) || {}) as Partial<CrawlScheduleConfig>
  const validationError = validateSchedule(body)
  if (validationError) {
    throw createError({ statusCode: 400, message: validationError })
  }

  // Ensure the zone exists and belongs to the site (defense in depth — requireZoneAccess
  // already enforces this, but defense in depth prevents orphaned schedules).
  const zone = await Zone.findOne({ _id: zoneId, siteId }).select('_id').lean()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone not found', data: { errorCode: 'ZONE_NOT_FOUND' } })
  }

  const existing = await CrawlSchedule.findOne({ zoneId, siteId }).lean()
  const now = new Date()

  const next = {
    siteId,
    zoneId,
    enabled: body.enabled!,
    frequency: body.frequency!,
    dayOfWeek: body.frequency === 'weekly' || body.frequency === 'biweekly' ? (body.dayOfWeek ?? 1) : null,
    dayOfMonth: body.frequency === 'monthly' && !body.lastDayOfMonth ? (body.dayOfMonth ?? 1) : null,
    lastDayOfMonth: body.frequency === 'monthly' ? !!body.lastDayOfMonth : false,
    hour: body.hour!,
    lastCrawledAt: existing?.lastCrawledAt ?? null,
    nextCrawlAt: null as Date | null,
  }
  next.nextCrawlAt = next.enabled ? computeNextCrawlAt(next, now) : null

  const schedule = await CrawlSchedule.findOneAndUpdate(
    { zoneId, siteId },
    { $set: next },
    { upsert: true, returnDocument: 'after' },
  ).lean()

  return { schedule }
})
