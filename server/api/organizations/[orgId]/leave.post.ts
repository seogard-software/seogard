import { OrgMember } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const orgId = requireValidId(event, 'orgId')

  const log = useRequestLog(event, 'api.organizations')

  const member = await OrgMember.findOne({ orgId, userId })
  if (!member) {
    throw createError({ statusCode: 404, message: 'Not a member of this organization', data: { errorCode: 'NOT_ORG_MEMBER' } })
  }

  if (member.role === 'owner') {
    // Check if there's at least one other owner
    const otherOwners = await OrgMember.countDocuments({
      orgId,
      role: 'owner',
      userId: { $ne: userId },
    })
    if (otherOwners === 0) {
      throw createError({
        statusCode: 403,
        message: 'Sole owner cannot leave. Transfer ownership or delete the organization.', data: { errorCode: 'SOLE_OWNER_CANNOT_LEAVE' },
      })
    }
  }

  await OrgMember.deleteOne({ _id: member._id })

  log.info({ orgId, userId, role: member.role }, 'member left organization')

  return { success: true }
})
