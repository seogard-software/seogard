import { Zone, Site, OrgMember } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const siteId = requireValidId(event)

  const site = await Site.findById(siteId).lean()
  if (!site) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  const member = await OrgMember.findOne({ orgId: (site as any).orgId, userId }).lean()
  if (!member) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  const zones = await Zone.find({ siteId })
    .sort({ isDefault: -1, name: 1 })
    .lean()

  const zoneRoleMap = new Map(
    ((member as any).zoneRoles ?? []).map((zr: any) => [zr.zoneId.toString(), zr.role]),
  )

  // Owner sees all zones with role "owner"
  if (member.role === 'owner') {
    return zones.map((z: any) => ({ ...z, userRole: 'owner' }))
  }

  // Others see only zones where they have a zone role
  return zones
    .filter((z: any) => zoneRoleMap.has(z._id.toString()))
    .map((z: any) => ({ ...z, userRole: zoneRoleMap.get(z._id.toString()) }))
})
