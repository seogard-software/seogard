import { Zone, OrgMember } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId requis' })
  }

  const { site } = await requireZoneAccess(event, siteId, zoneId, 'admin')

  const zone = await Zone.findOne({ _id: zoneId, siteId }).lean()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone introuvable' })
  }

  if (zone.isDefault) {
    throw createError({ statusCode: 403, message: 'La zone par défaut ne peut pas être supprimée' })
  }

  // Cascade: remove zoneRoles referencing this zone from all org members
  await OrgMember.updateMany(
    { orgId: (site as any).orgId },
    { $pull: { zoneRoles: { zoneId: zone._id } } },
  )

  await Zone.deleteOne({ _id: zoneId })

  return { success: true }
})
