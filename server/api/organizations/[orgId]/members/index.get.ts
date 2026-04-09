import { OrgMember, User } from '../../../../database/models'

export default defineEventHandler(async (event) => {
  const orgId = requireValidId(event, 'orgId')
  await requireOrgRole(event, orgId, 'owner')

  const members = await OrgMember.find({ orgId }).lean()
  const userIds = members.map(m => m.userId)
  const users = await User.find({ _id: { $in: userIds } })
    .select('_id email name avatarUrl')
    .lean()

  const userMap = new Map(users.map(u => [u._id.toString(), u]))

  const enrichedMembers = members.map(m => ({
    _id: m._id,
    orgId: m.orgId,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt,
    user: userMap.get(m.userId.toString()) ?? null,
  }))

  return { members: enrichedMembers }
})
