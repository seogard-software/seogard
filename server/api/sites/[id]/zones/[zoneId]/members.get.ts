import { OrgMember, OrgInvite } from '~~/server/database/models'
import type { OrgRole } from '~~/shared/types/organization'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId requis' })
  }

  const { site } = await requireZoneAccess(event, siteId, zoneId, 'admin')

  const orgId = (site as any).orgId

  const [members, pendingInvites] = await Promise.all([
    OrgMember.find({ orgId })
      .populate('userId', 'email name avatarUrl')
      .lean(),
    OrgInvite.find({ orgId, zoneId, status: 'pending' })
      .select('email zoneRole')
      .lean(),
  ])

  // Only return members who have access to this zone: owners + members with explicit zone role
  const zoneMembers = members
    .filter((m: any) => m.role === 'owner' || m.zoneRoles?.some((zr: any) => zr.zoneId.toString() === zoneId))
    .map((m: any) => ({
      _id: m._id.toString(),
      userId: m.userId?._id?.toString() ?? m.userId?.toString(),
      user: m.userId && typeof m.userId === 'object' ? {
        _id: m.userId._id.toString(),
        email: m.userId.email,
        name: m.userId.name,
        avatarUrl: m.userId.avatarUrl,
      } : null,
      orgRole: m.role as OrgRole,
      zoneRole: (m.zoneRoles?.find((zr: any) => zr.zoneId.toString() === zoneId)?.role ?? null) as OrgRole | null,
    }))

  // Org members without a role on this zone (available to add)
  const availableMembers = members
    .filter((m: any) => m.role !== 'owner' && !m.zoneRoles?.some((zr: any) => zr.zoneId.toString() === zoneId))
    .map((m: any) => ({
      _id: m._id.toString(),
      userId: m.userId?._id?.toString() ?? m.userId?.toString(),
      user: m.userId && typeof m.userId === 'object' ? {
        _id: m.userId._id.toString(),
        email: m.userId.email,
        name: m.userId.name,
      } : null,
    }))

  return {
    members: zoneMembers,
    available: availableMembers,
    invites: pendingInvites.map((inv: any) => ({
      _id: inv._id.toString(),
      email: inv.email,
      role: inv.zoneRole ?? 'member',
    })),
  }
})
