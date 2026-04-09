import { OrgMember } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const orgId = requireValidId(event, 'orgId')

  const log = useRequestLog(event, 'api.organizations')

  const member = await OrgMember.findOne({ orgId, userId })
  if (!member) {
    throw createError({ statusCode: 404, message: 'Vous n\'êtes pas membre de cette organisation' })
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
        message: 'Vous êtes le seul owner. Transférez la propriété à un autre membre ou supprimez l\'organisation.',
      })
    }
  }

  await OrgMember.deleteOne({ _id: member._id })

  log.info({ orgId, userId, role: member.role }, 'member left organization')

  return { success: true }
})
