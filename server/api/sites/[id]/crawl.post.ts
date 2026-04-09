import { Site, Crawl, Subscription, Zone, User } from '../../../database/models'
import { canUseCrawls } from '../../../../shared/utils/pricing'
import { isSelfHosted } from '../../../utils/deployment'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.sites')
  const id = requireValidId(event)
  const { site } = await requireSiteAccess(event, id, 'member')

  const userId = requireAuth(event)
  const user = await User.findById(userId).select('trialEndsAt').lean()

  if (!isSelfHosted()) {
    const sub = await Subscription.findOne({ orgId: (site as any).orgId }).lean()
    if (!sub || !canUseCrawls(sub.stripeStatus, (user as any)?.trialEndsAt)) {
      throw createError({ statusCode: 403, message: 'Votre essai de 14 jours est terminé. Activez la facturation dans les paramètres pour continuer.' })
    }
  }

  // Resolve default zone for backward compatibility
  const defaultZone = await Zone.findOne({ siteId: id, isDefault: true }).lean()

  const crawl = await Crawl.create({
    siteId: id,
    zoneId: defaultZone?._id ?? null,
    trigger: 'manual',
    status: 'pending',
  })

  if (!crawl) throw createError({ statusCode: 500, message: 'Database insert failed' })

  log.info({ siteId: id, siteName: site.name, crawlId: crawl._id, zoneId: defaultZone?._id }, 'manual crawl requested')

  return crawl
})
