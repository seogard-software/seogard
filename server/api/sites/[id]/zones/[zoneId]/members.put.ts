import { OrgMember } from '~~/server/database/models'

const VALID_ZONE_ROLES = ['admin', 'member', 'viewer'] as const

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId requis' })
  }

  const { role: callerRole } = await requireZoneAccess(event, siteId, zoneId, 'admin')

  const body = await readBody(event)

  if (!body?.memberId || typeof body.memberId !== 'string') {
    throw createError({ statusCode: 400, message: 'memberId requis' })
  }

  if (!body.role || !VALID_ZONE_ROLES.includes(body.role)) {
    throw createError({ statusCode: 400, message: 'Rôle invalide. Doit être admin, member ou viewer' })
  }

  const member = await OrgMember.findById(body.memberId)
  if (!member) {
    throw createError({ statusCode: 404, message: 'Membre introuvable' })
  }

  if (member.role === 'owner') {
    throw createError({ statusCode: 403, message: 'Impossible de modifier le rôle zone d\'un owner' })
  }

  // An admin can only modify roles below their own level
  if (callerRole !== 'owner') {
    const targetZoneRole = member.zoneRoles.find((zr: any) => zr.zoneId.toString() === zoneId)?.role
    if (targetZoneRole === 'admin') {
      throw createError({ statusCode: 403, message: 'Seul un owner peut modifier le rôle d\'un admin' })
    }
  }

  // Update or add zone role
  const existingIndex = member.zoneRoles.findIndex((zr: any) => zr.zoneId.toString() === zoneId)
  if (existingIndex !== -1) {
    member.zoneRoles[existingIndex]!.role = body.role
  } else {
    member.zoneRoles.push({ zoneId, role: body.role })
  }

  await member.save()

  return { success: true }
})
