import { OrgMember } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const orgId = requireValidId(event, 'orgId')
  await requireOrgRole(event, orgId, 'owner')

  const log = useRequestLog(event, 'api.organizations')
  const body = await readBody(event)

  if (!body?.memberId || typeof body.memberId !== 'string') {
    throw createError({ statusCode: 400, message: 'memberId required', data: { errorCode: 'MEMBER_ID_REQUIRED' } })
  }

  const targetMember = await OrgMember.findOne({ _id: body.memberId, orgId })
  if (!targetMember) {
    throw createError({ statusCode: 404, message: 'Member not found', data: { errorCode: 'MEMBER_NOT_FOUND' } })
  }

  if (targetMember.role === 'owner') {
    throw createError({ statusCode: 400, message: 'Member is already an owner', data: { errorCode: 'ALREADY_OWNER' } })
  }

  // Promote target to owner
  targetMember.role = 'owner'
  await targetMember.save()

  log.info({ orgId, promotedUserId: targetMember.userId, byUserId: userId }, 'ownership transferred')

  return { success: true }
})
