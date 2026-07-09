import { OrgMember } from '~~/server/database/models'

const VALID_ZONE_ROLES = ['admin', 'member', 'viewer'] as const

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId required', data: { errorCode: 'ZONE_ID_REQUIRED' } })
  }

  const { role: callerRole } = await requireZoneAccess(event, siteId, zoneId, 'admin')

  const body = await readBody(event)

  if (!body?.memberId || typeof body.memberId !== 'string') {
    throw createError({ statusCode: 400, message: 'memberId required', data: { errorCode: 'MEMBER_ID_REQUIRED' } })
  }

  if (!body.role || !VALID_ZONE_ROLES.includes(body.role)) {
    throw createError({ statusCode: 400, message: 'Invalid role: must be admin, member or viewer', data: { errorCode: 'ROLE_INVALID' } })
  }

  const member = await OrgMember.findById(body.memberId)
  if (!member) {
    throw createError({ statusCode: 404, message: 'Member not found', data: { errorCode: 'MEMBER_NOT_FOUND' } })
  }

  if (member.role === 'owner') {
    throw createError({ statusCode: 403, message: 'Cannot change the zone role of an owner', data: { errorCode: 'CANNOT_CHANGE_OWNER_ROLE' } })
  }

  // An admin can only modify roles below their own level
  if (callerRole !== 'owner') {
    const targetZoneRole = member.zoneRoles.find((zr: any) => zr.zoneId.toString() === zoneId)?.role
    if (targetZoneRole === 'admin') {
      throw createError({ statusCode: 403, message: 'Only an owner can change the role of an admin', data: { errorCode: 'OWNER_REQUIRED_FOR_ADMIN' } })
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
