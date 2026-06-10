import { Subscription, Zone, User, Organization, Crawl } from '~~/server/database/models'
import { canUseCrawls } from '~~/shared/utils/pricing'
import { isSelfHosted } from '~~/server/utils/deployment'
import { triggerSiteCrawl } from '~~/server/utils/crawl-trigger'
import { requireZoneCrawlAccess } from '~~/server/utils/zone-ci-auth'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.zones')
  const siteId = requireValidId(event)
  // ObjectId validé → un zoneId malformé (typo CI) répond 400, pas un CastError 500.
  const zoneId = requireValidId(event, 'zoneId')

  // CI (clé API du site) OU dashboard (session).
  const { site, viaApiKey } = await requireZoneCrawlAccess(event, siteId, zoneId, 'member')

  const zone = await Zone.findOne({ _id: zoneId, siteId }).lean()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone introuvable' })
  }

  // Entitlement = l'ORGA, jamais l'utilisateur qui clique : trial du OWNER de l'orga pour
  // tous les chemins (session ET clé API). Sinon un owner expiré pourrait inviter un compte
  // neuf (trial frais) et relancer des crawls à l'infini sur la même orga.
  if (!isSelfHosted()) {
    const sub = await Subscription.findOne({ orgId: (site as any).orgId }).lean()
    let trialEndsAt: Date | null = null
    if ((sub as any)?.stripeStatus === 'trialing') {
      const org = await Organization.findById((site as any).orgId).select('ownerId').lean()
      const owner = org ? await User.findById((org as any).ownerId).select('trialEndsAt').lean() : null
      trialEndsAt = (owner as any)?.trialEndsAt ?? null
    }
    if (!sub || !canUseCrawls((sub as any).stripeStatus, trialEndsAt)) {
      throw createError({ statusCode: 403, message: 'Votre essai de 14 jours est terminé. Activez la facturation dans les paramètres pour continuer.' })
    }
  }

  // CI : un nouveau deploy supersède le crawl en cours de CETTE zone (cancel-and-restart).
  if (viaApiKey) {
    await Crawl.updateMany(
      { siteId, zoneId: zone._id, status: { $in: ['pending', 'running'] } },
      { status: 'cancelled', error: 'Superseded by new deploy webhook' },
    )
  }

  // Crawle LA zone affichée (défaut ou custom) ; le crawler scope par patterns (défaut = site entier).
  // Trigger 'webhook' si déclenché par la CI (clé API), 'manual' depuis le dashboard.
  const crawl = await triggerSiteCrawl(siteId, zone._id, viaApiKey ? 'webhook' : 'manual')

  log.info({ siteId, zoneName: zone.name, zoneId: zone._id, crawlId: crawl._id, viaApiKey }, 'zone crawl requested')

  return crawl
})
