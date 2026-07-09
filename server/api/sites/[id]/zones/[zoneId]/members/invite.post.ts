import { OrgMember, OrgInvite, Organization, User, Zone } from '~~/server/database/models'
import { sendInviteEmail } from '~~/server/utils/email'

const VALID_ROLES = ['admin', 'member', 'viewer'] as const

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId required', data: { errorCode: 'ZONE_ID_REQUIRED' } })
  }

  const { site } = await requireZoneAccess(event, siteId, zoneId, 'admin')

  const zone = await Zone.findById(zoneId).lean()
  if (!zone || (zone as any).siteId.toString() !== siteId) {
    throw createError({ statusCode: 404, message: 'Zone not found', data: { errorCode: 'ZONE_NOT_FOUND' } })
  }

  const log = useRequestLog(event, 'api.zone-members')
  const body = await readBody(event)

  if (!body?.email || typeof body.email !== 'string') {
    throw createError({ statusCode: 400, message: 'Email required', data: { errorCode: 'EMAIL_REQUIRED' } })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw createError({ statusCode: 400, message: 'Invalid email address', data: { errorCode: 'EMAIL_INVALID' } })
  }

  if (!body.role || !VALID_ROLES.includes(body.role)) {
    throw createError({ statusCode: 400, message: 'Invalid role: must be admin, member or viewer', data: { errorCode: 'ROLE_INVALID' } })
  }

  const orgId = (site as any).orgId

  // Check if already a member with zone access
  const existingUser = await User.findOne({ email: body.email }).lean()
  if (existingUser) {
    const existingMember = await OrgMember.findOne({ orgId, userId: existingUser._id }).lean()
    if (existingMember) {
      // Already in org — just add zone role directly
      const hasZoneRole = (existingMember as any).zoneRoles?.some(
        (zr: any) => zr.zoneId.toString() === zoneId,
      )
      if (hasZoneRole) {
        throw createError({ statusCode: 409, message: 'User already has a role in this zone', data: { errorCode: 'INVITE_ALREADY_MEMBER' } })
      }

      await OrgMember.updateOne(
        { _id: existingMember._id },
        { $push: { zoneRoles: { zoneId, role: body.role } } },
      )

      log.info({ orgId, zoneId, email: body.email, role: body.role }, 'zone role added to existing member')
      return { success: true, directAdd: true }
    }
  }

  // Check if already invited
  const existingInvite = await OrgInvite.findOne({
    orgId,
    email: body.email,
    status: 'pending',
  }).lean()
  if (existingInvite) {
    throw createError({ statusCode: 409, message: 'An invitation is already pending for this email', data: { errorCode: 'INVITE_ALREADY_PENDING' } })
  }

  // Create invite with zone info
  const invite = await OrgInvite.create({
    orgId,
    email: body.email,
    role: 'member', // org-level role is always basic "member"
    zoneId,
    zoneRole: body.role,
    invitedBy: userId,
  })

  // Send invitation email — dans la langue de l'inviteur (langue de travail de l'org).
  const org = await Organization.findById(orgId).select('name').lean()
  if (org) {
    sendInviteEmail(body.email, org.name, body.role, (invite as any).token, body.locale)
  }

  log.info({ orgId, zoneId, invitedEmail: body.email, zoneRole: body.role }, 'zone invite sent')

  return invite
})
