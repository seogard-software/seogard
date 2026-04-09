import { Subscription } from '../../database/models'
import { getStripe } from '../../utils/stripe'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const log = useRequestLog(event, 'api.stripe')
  const orgId = getOrgIdFromHeader(event)
  await requireOrgRole(event, orgId, 'owner')

  const stripe = getStripe()
  if (!stripe) throw createError({ statusCode: 500, message: 'Stripe not configured' })

  const sub = await Subscription.findOne({ orgId }).lean()
  if (!sub?.stripeCustomerId) {
    throw createError({ statusCode: 400, message: 'No Stripe customer linked to this account' })
  }

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${appUrl}/dashboard/organizations/${orgId}/billing`,
  })

  log.info({ userId, orgId, customerId: sub.stripeCustomerId }, 'billing portal session created')

  return { url: session.url }
})
