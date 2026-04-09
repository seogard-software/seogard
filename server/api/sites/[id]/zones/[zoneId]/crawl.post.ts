import { Site, Crawl, Subscription, Zone, User } from '~~/server/database/models'
import { canUseCrawls } from '~~/shared/utils/pricing'
import { isSelfHosted } from '~~/server/utils/deployment'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.zones')
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId requis' })
  }

  const { site } = await requireZoneAccess(event, siteId, zoneId, 'member')

  const zone = await Zone.findOne({ _id: zoneId, siteId }).lean()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone introuvable' })
  }

  const userId = requireAuth(event)
  const user = await User.findById(userId).select('trialEndsAt').lean()

  if (!isSelfHosted()) {
    const sub = await Subscription.findOne({ orgId: (site as any).orgId }).lean()
    if (!sub || !canUseCrawls(sub.stripeStatus, (user as any)?.trialEndsAt)) {
      throw createError({ statusCode: 403, message: 'Votre essai de 14 jours est terminé. Activez la facturation dans les paramètres pour continuer.' })
    }
  }

  const crawl = await Crawl.create({
    siteId,
    zoneId: zone._id,
    trigger: 'manual',
    status: 'pending',
  })

  if (!crawl) throw createError({ statusCode: 500, message: 'Database insert failed' })

  log.info({ siteId, zoneName: zone.name, zoneId: zone._id, crawlId: crawl._id }, 'zone crawl requested')

  return crawl
})
