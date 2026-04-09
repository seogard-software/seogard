import { Subscription } from '../../database/models'
import { getStripe } from '../../utils/stripe'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.stripe')

  const userId = requireAuth(event)
  log.info({ userId }, 'subscribe: auth OK')

  const orgId = getOrgIdFromHeader(event)
  log.info({ orgId }, 'subscribe: orgId OK')

  await requireOrgRole(event, orgId, 'owner')
  log.info('subscribe: owner role OK')

  const stripe = getStripe()
  if (!stripe) throw createError({ statusCode: 500, message: 'Stripe not configured' })
  log.info('subscribe: stripe OK')

  const priceId = process.env.STRIPE_PRICE_METERED
  if (!priceId) throw createError({ statusCode: 500, message: 'STRIPE_PRICE_METERED not configured' })

  const sub = await Subscription.findOne({ orgId }).lean()
  if (!sub) throw createError({ statusCode: 404, message: 'Subscription not found' })

  const { User } = await import('../../database/models')
  const user = await User.findById(userId).lean()
  if (!user) throw createError({ statusCode: 404, message: 'User not found' })

  let customerId = sub.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId, orgId },
    })
    customerId = customer.id

    await Subscription.updateOne({ orgId }, { stripeCustomerId: customerId })
    log.info({ userId, orgId, customerId }, 'stripe customer created')
  }

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // If still in trial, let Stripe know so the user isn't charged until trial ends
  // Stripe requires trial_end to be at least 48h in the future for checkout sessions
  const trialEnd = user.trialEndsAt ? Math.floor(new Date(user.trialEndsAt).getTime() / 1000) : undefined
  const now = Math.floor(Date.now() / 1000)
  const minTrialEnd = now + 48 * 3600
  const hasTrialRemaining = trialEnd && trialEnd > minTrialEnd

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId }],
      ...(hasTrialRemaining && {
        subscription_data: { trial_end: trialEnd },
      }),
      success_url: `${appUrl}/dashboard/organizations/${orgId}/billing?checkout=success`,
      cancel_url: `${appUrl}/dashboard/organizations/${orgId}/billing?checkout=cancel`,
    })

    log.info({ userId, orgId, sessionId: session.id, hasTrialRemaining }, 'checkout session created')

    return { url: session.url }
  } catch (err: any) {
    log.error({ userId, orgId, stripeError: err.message, code: err.code, priceId }, 'stripe checkout session failed')
    throw createError({ statusCode: err.statusCode || 500, message: err.message || 'Stripe error' })
  }
})
