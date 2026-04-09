import { Organization, OrgMember, OrgInvite, Site, Zone, MonitoredPage, Alert, Subscription } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const orgId = requireValidId(event, 'orgId')
  await requireOrgRole(event, orgId, 'owner')

  const log = useRequestLog(event, 'api.organizations')

  const org = await Organization.findById(orgId).lean()
  if (!org) {
    throw createError({ statusCode: 404, message: 'Organisation non trouvée' })
  }

  // Cascade delete all related data
  const sites = await Site.find({ orgId }).select('_id').lean()
  const siteIds = sites.map(s => s._id)

  if (siteIds.length > 0) {
    const zones = await Zone.find({ siteId: { $in: siteIds } }).select('_id').lean()
    const zoneIds = zones.map(z => z._id)

    await Promise.all([
      MonitoredPage.deleteMany({ siteId: { $in: siteIds } }),
      Alert.deleteMany({ siteId: { $in: siteIds } }),
      Zone.deleteMany({ _id: { $in: zoneIds } }),
      Site.deleteMany({ _id: { $in: siteIds } }),
    ])
  }

  await Promise.all([
    OrgMember.deleteMany({ orgId }),
    OrgInvite.deleteMany({ orgId }),
    Subscription.deleteMany({ orgId }),
    Organization.deleteOne({ _id: orgId }),
  ])

  log.info({ orgId, orgName: (org as any).name }, 'organization deleted')

  return { success: true }
})
