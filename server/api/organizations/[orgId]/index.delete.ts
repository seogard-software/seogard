import { Organization, OrgMember, OrgInvite, Site, Subscription } from '../../../database/models'
import { deleteSitesCascade } from '../../../database/cascade'

export default defineEventHandler(async (event) => {
  const orgId = requireValidId(event, 'orgId')
  await requireOrgRole(event, orgId, 'owner')

  const log = useRequestLog(event, 'api.organizations')

  const org = await Organization.findById(orgId).lean()
  if (!org) {
    throw createError({ statusCode: 404, message: 'Organisation non trouvée' })
  }

  // Cascade unique (registre + tripwire) : server/database/cascade.ts — même cascade que le
  // delete de site, appliquée à tous les sites de l'org.
  const sites = await Site.find({ orgId }).select('_id').lean()
  const siteIds = sites.map(s => s._id)

  if (siteIds.length > 0) {
    await deleteSitesCascade(siteIds)
    await Site.deleteMany({ _id: { $in: siteIds } })
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
