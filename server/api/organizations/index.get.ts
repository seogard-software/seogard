import { OrgMember, Organization } from '../../database/models'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)

  const memberships = await OrgMember.find({ userId }).lean()
  const orgIds = memberships.map(m => m.orgId)
  const orgs = await Organization.find({ _id: { $in: orgIds } }).lean()

  const roleMap = new Map(memberships.map(m => [m.orgId.toString(), m.role]))

  return orgs.map(org => ({
    _id: org._id,
    name: org.name,
    slug: (org as any).slug,
    type: (org as any).type,
    role: roleMap.get(org._id.toString()),
    logoUrl: (org as any).logoUrl,
    enforceSSO: (org as any).enforceSSO,
    allowedDomains: (org as any).allowedDomains,
    createdAt: org.createdAt,
  }))
})
