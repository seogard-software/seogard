import { Site, Crawl, Subscription, User, Organization } from '../../database/models'
import { canUseCrawls } from '../../../shared/utils/pricing'
import { isSelfHosted } from '../../utils/deployment'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.webhooks')
  const apiKey = getHeader(event, 'x-api-key')

  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'API key requise' })
  }

  const site = await Site.findOne({ apiKey }).select('_id name orgId').lean()

  if (!site) {
    throw createError({ statusCode: 401, message: 'API key invalide' })
  }

  // Check subscription (skip in self-hosted mode)
  if (!isSelfHosted()) {
    const sub = await Subscription.findOne({ orgId: (site as any).orgId }).lean()

    let ownerTrialEndsAt: Date | null = null
    if (sub?.stripeStatus === 'trialing') {
      const org = await Organization.findById((site as any).orgId).select('ownerId').lean()
      if (org) {
        const owner = await User.findById((org as any).ownerId).select('trialEndsAt').lean()
        ownerTrialEndsAt = (owner as any)?.trialEndsAt ?? null
      }
    }

    if (!sub || !canUseCrawls(sub.stripeStatus, ownerTrialEndsAt)) {
      throw createError({ statusCode: 403, message: 'Subscription inactive ou essai terminé' })
    }
  }

  // Cancel existing pending/running crawls (superseded by new deploy)
  await Crawl.updateMany(
    { siteId: site._id, status: { $in: ['pending', 'running'] } },
    { status: 'cancelled', error: 'Superseded by new deploy webhook' },
  )

  const crawl = await Crawl.create({
    siteId: site._id,
    trigger: 'webhook',
    status: 'pending',
  })

  if (!crawl) throw createError({ statusCode: 500, message: 'Database insert failed' })

  log.info({ siteId: site._id, siteName: site.name, crawlId: crawl._id, trigger: 'webhook' }, 'deploy webhook received, crawl enqueued')

  return {
    success: true,
    crawlId: crawl._id,
    message: 'Crawl post-deploy enqueue',
  }
})
