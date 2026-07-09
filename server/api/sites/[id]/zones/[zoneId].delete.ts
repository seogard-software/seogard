import { Zone, OrgMember, CrawlSchedule } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId required', data: { errorCode: 'ZONE_ID_REQUIRED' } })
  }

  const { site } = await requireZoneAccess(event, siteId, zoneId, 'admin')

  const zone = await Zone.findOne({ _id: zoneId, siteId }).lean()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone not found', data: { errorCode: 'ZONE_NOT_FOUND' } })
  }

  if (zone.isDefault) {
    throw createError({ statusCode: 403, message: 'Default zone cannot be deleted', data: { errorCode: 'DEFAULT_ZONE_UNDELETABLE' } })
  }

  // Cascade: remove zoneRoles referencing this zone from all org members,
  // and drop any scheduled crawl bound to it.
  await Promise.all([
    OrgMember.updateMany(
      { orgId: (site as any).orgId },
      { $pull: { zoneRoles: { zoneId: zone._id } } },
    ),
    CrawlSchedule.deleteMany({ zoneId: zone._id }),
  ])

  await Zone.deleteOne({ _id: zoneId })

  return { success: true }
})
