import { User, Subscription, Site, MonitoredPage, OrgMember, Organization } from '../../database/models'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)

  const user = await User.findById(userId).select('-passwordHash -totpSecret -backupCodes').lean()

  if (!user) {
    throw createError({ statusCode: 404, message: 'Utilisateur non trouvé' })
  }

  // Fetch all organizations the user belongs to
  const memberships = await OrgMember.find({ userId }).lean()
  const orgIds = memberships.map(m => m.orgId)
  const orgs = await Organization.find({ _id: { $in: orgIds } }).select('_id name slug').lean()

  const roleMap = new Map(memberships.map(m => [m.orgId.toString(), m.role]))
  const organizations = orgs.map(org => ({
    _id: org._id,
    name: org.name,
    slug: org.slug,
    role: roleMap.get(org._id.toString()),
  }))

  // Use client's active org if valid, otherwise fall back to first org
  const requestedOrgId = getHeader(event, 'x-org-id')
  const activeOrgId = (requestedOrgId && organizations.some(o => o._id.toString() === requestedOrgId))
    ? requestedOrgId
    : organizations[0]?._id?.toString() ?? null

  // Get subscription for the active org
  const subscription = activeOrgId
    ? await Subscription.findOne({ orgId: activeOrgId }).lean()
    : null

  // Count only pages crawled during the current billing period
  const orgSiteIds = activeOrgId
    ? await Site.find({ orgId: activeOrgId }).select('_id').lean()
    : []
  const periodStart = subscription?.currentPeriodStart
    ? new Date(subscription.currentPeriodStart)
    : null
  const totalPagesUsed = orgSiteIds.length > 0 && periodStart
    ? await MonitoredPage.countDocuments({
        siteId: { $in: orgSiteIds.map(s => s._id) },
        lastCheckedAt: { $gte: periodStart },
      })
    : 0

  return {
    user,
    organizations,
    activeOrgId,
    trialEndsAt: (user as any).trialEndsAt ?? null,
    subscription: subscription
      ? {
          stripeStatus: subscription.stripeStatus,
          stripeCustomerId: subscription.stripeCustomerId ?? null,
          stripeSubscriptionId: subscription.stripeSubscriptionId ?? null,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          totalPagesUsed,
        }
      : null,
  }
})
