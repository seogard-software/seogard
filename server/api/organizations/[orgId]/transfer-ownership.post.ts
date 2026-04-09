import { OrgMember } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const orgId = requireValidId(event, 'orgId')
  await requireOrgRole(event, orgId, 'owner')

  const log = useRequestLog(event, 'api.organizations')
  const body = await readBody(event)

  if (!body?.memberId || typeof body.memberId !== 'string') {
    throw createError({ statusCode: 400, message: 'memberId requis' })
  }

  const targetMember = await OrgMember.findOne({ _id: body.memberId, orgId })
  if (!targetMember) {
    throw createError({ statusCode: 404, message: 'Membre non trouvé' })
  }

  if (targetMember.role === 'owner') {
    throw createError({ statusCode: 400, message: 'Ce membre est déjà owner' })
  }

  // Promote target to owner
  targetMember.role = 'owner'
  await targetMember.save()

  log.info({ orgId, promotedUserId: targetMember.userId, byUserId: userId }, 'ownership transferred')

  return { success: true }
})
