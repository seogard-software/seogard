import type Stripe from 'stripe'
import { Subscription, Payment, User, Site, MonitoredPage } from '../../database/models'
import { getStripe } from '../../utils/stripe'
import { sendPaymentFailedEmail } from '../../utils/email'
import { createLogger } from '../../utils/logger'

const log = createLogger('web', 'api.stripe')

export default defineEventHandler(async (event) => {
  const stripe = getStripe()
  if (!stripe) throw createError({ statusCode: 500, message: 'Stripe not configured' })

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw createError({ statusCode: 500, message: 'STRIPE_WEBHOOK_SECRET not configured' })

  const rawBody = await readRawBody(event)
  if (!rawBody) throw createError({ statusCode: 400, message: 'Empty body' })

  const sig = getHeader(event, 'stripe-signature')
  if (!sig) throw createError({ statusCode: 400, message: 'Missing stripe-signature header' })

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    log.error({ errorCode: 'WEBHOOK_SIGNATURE_FAILED', error: (err as Error).message }, 'webhook signature verification failed')
    throw createError({ statusCode: 400, message: 'Invalid signature' })
  }

  log.info({ eventType: stripeEvent.type, eventId: stripeEvent.id }, 'stripe webhook received')

  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session)
      break
    case 'invoice.created':
      await handleInvoiceCreated(stripe, stripeEvent.data.object as Stripe.Invoice)
      break
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(stripeEvent.data.object as Stripe.Invoice)
      break
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(stripeEvent.data.object as Stripe.Invoice)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription)
      break
    default:
      log.info({ eventType: stripeEvent.type }, 'unhandled stripe event type')
  }

  return { received: true }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!customerId || !subscriptionId) {
    log.warn({ sessionId: session.id }, 'checkout.session.completed missing customer or subscription')
    return
  }

  // Retrieve subscription to check if it has a trial
  let stripeSub
  try {
    const stripe = getStripe()!
    stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
  } catch (err) {
    log.error({ customerId, subscriptionId, errorCode: 'STRIPE_RETRIEVE_FAILED', error: (err as Error).message }, 'failed to retrieve stripe subscription')
    throw err
  }

  const status = stripeSub.status === 'trialing' ? 'trialing' : 'active'

  // current_period_start/end may be on the subscription or on the first item depending on Stripe API version
  const periodStart = (stripeSub as any).current_period_start ?? (stripeSub as any).items?.data?.[0]?.current_period_start
  const periodEnd = (stripeSub as any).current_period_end ?? (stripeSub as any).items?.data?.[0]?.current_period_end

  log.info({ customerId, subscriptionId, status, periodStart, periodEnd }, 'checkout: subscription retrieved')

  const sub = await Subscription.findOneAndUpdate(
    { stripeCustomerId: customerId },
    {
      stripeSubscriptionId: subscriptionId,
      stripeStatus: status,
      ...(periodStart && { currentPeriodStart: new Date(periodStart * 1000) }),
      ...(periodEnd && { currentPeriodEnd: new Date(periodEnd * 1000) }),
    },
    { new: true },
  )

  if (!sub) {
    log.error({ customerId, subscriptionId, errorCode: 'CHECKOUT_SUB_NOT_FOUND' }, 'no subscription found for stripe customer')
    return
  }

  log.info({ customerId, subscriptionId, orgId: sub.orgId }, 'checkout completed, subscription active')
}

async function handleInvoiceCreated(stripe: Stripe, invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const sub = await Subscription.findOne({ stripeSubscriptionId: subscriptionId }).lean()
  if (!sub) {
    log.warn({ subscriptionId, invoiceId: invoice.id, errorCode: 'INVOICE_SUB_NOT_FOUND' }, 'subscription not found for invoice.created')
    return
  }

  // Count only pages actually crawled during this billing period
  const periodStart = new Date(invoice.period_start * 1000)
  const orgSiteIds = await Site.find({ orgId: sub.orgId }).select('_id').lean()
  const pageCount = orgSiteIds.length > 0
    ? await MonitoredPage.countDocuments({
        siteId: { $in: orgSiteIds.map(s => s._id) },
        lastCheckedAt: { $gte: periodStart },
      })
    : 0

  log.info({ orgId: sub.orgId, invoiceId: invoice.id, pageCount, subscriptionId }, 'invoice.created: usage count computed')

  if (pageCount === 0) {
    log.info({ orgId: sub.orgId, invoiceId: invoice.id }, 'no monitored pages, skipping usage record')
    return
  }

  // Find the subscription item to report usage on
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  const itemId = stripeSubscription.items?.data[0]?.id
  if (!itemId) {
    log.error({ subscriptionId, errorCode: 'NO_SUBSCRIPTION_ITEM' }, 'no subscription item found')
    return
  }

  try {
    await stripe.subscriptionItems.createUsageRecord(itemId, {
      quantity: pageCount,
      action: 'set',
    })
    log.info({ orgId: sub.orgId, invoiceId: invoice.id, pageCount, itemId }, 'usage record reported')
  }
  catch (err) {
    log.error({ orgId: sub.orgId, invoiceId: invoice.id, pageCount, itemId, errorCode: 'USAGE_RECORD_FAILED', error: (err as Error).message }, 'failed to report usage record')
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const sub = await Subscription.findOne({ stripeCustomerId: customerId }).lean()
  if (!sub) {
    log.warn({ customerId, invoiceId: invoice.id, errorCode: 'INVOICE_SUB_NOT_FOUND' }, 'subscription not found for invoice')
    return
  }

  // Count only pages actually crawled during this billing period
  const periodStart = new Date(invoice.period_start * 1000)
  const periodEnd = new Date(invoice.period_end * 1000)
  const orgSiteIds = await Site.find({ orgId: sub.orgId }).select('_id').lean()
  const pagesCount = orgSiteIds.length > 0
    ? await MonitoredPage.countDocuments({
        siteId: { $in: orgSiteIds.map(s => s._id) },
        lastCheckedAt: { $gte: periodStart },
      })
    : 0

  log.info({ customerId, invoiceId: invoice.id, orgId: sub.orgId, pagesCount, periodStart, periodEnd }, 'invoice.payment_succeeded: saving payment record')

  try {
    await Payment.create({
      orgId: sub.orgId,
      subscriptionId: sub._id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: null,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      pagesCount,
      invoicePdfUrl: invoice.invoice_pdf ?? null,
      periodStart,
      periodEnd,
    })

    // Update status and billing period dates
    await Subscription.updateOne({ _id: sub._id }, {
      stripeStatus: 'active',
      ...(invoice.period_start && { currentPeriodStart: periodStart }),
      ...(invoice.period_end && { currentPeriodEnd: periodEnd }),
    })

    log.info({ customerId, invoiceId: invoice.id, amount: invoice.amount_paid, orgId: sub.orgId, pagesCount }, 'payment succeeded')
  } catch (err) {
    log.error({ customerId, invoiceId: invoice.id, orgId: sub.orgId, errorCode: 'PAYMENT_SUCCEEDED_DB_FAILED', error: (err as Error).message }, 'failed to save payment or update subscription')
    throw err
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const sub = await Subscription.findOne({ stripeCustomerId: customerId }).lean()
  if (!sub) {
    log.warn({ customerId, invoiceId: invoice.id, errorCode: 'INVOICE_SUB_NOT_FOUND' }, 'subscription not found for failed invoice')
    return
  }

  log.info({ customerId, invoiceId: invoice.id, orgId: sub.orgId, periodStart: new Date(invoice.period_start * 1000), periodEnd: new Date(invoice.period_end * 1000) }, 'invoice.payment_failed: processing failed payment')

  try {
    await Payment.create({
      orgId: sub.orgId,
      subscriptionId: sub._id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: null,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      pagesCount: null,
      invoicePdfUrl: invoice.invoice_pdf ?? null,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    })

    await Subscription.updateOne({ _id: sub._id }, { stripeStatus: 'past_due' })
  } catch (err) {
    log.error({ customerId, invoiceId: invoice.id, orgId: sub.orgId, errorCode: 'PAYMENT_FAILED_DB_FAILED', error: (err as Error).message }, 'failed to save failed payment or update subscription')
    throw err
  }

  const { Organization } = await import('../../database/models')
  const org = await Organization.findById(sub.orgId).lean()
  if (org) {
    const user = await User.findById((org as any).ownerId).lean()
    if (user?.email) {
      sendPaymentFailedEmail(user.email, user._id.toString(), sub.orgId.toString())
    }
  }

  log.info({ customerId, invoiceId: invoice.id, amount: invoice.amount_due, orgId: sub.orgId }, 'payment failed, status set to past_due')
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Sync status and billing period dates
  const periodStart = (subscription as any).current_period_start ?? (subscription as any).items?.data?.[0]?.current_period_start
  const periodEnd = (subscription as any).current_period_end ?? (subscription as any).items?.data?.[0]?.current_period_end

  log.info({ stripeSubscriptionId: subscription.id, status: subscription.status, periodStart, periodEnd }, 'subscription.updated: syncing period and status')

  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      stripeStatus: subscription.status,
      ...(periodStart && { currentPeriodStart: new Date(periodStart * 1000) }),
      ...(periodEnd && { currentPeriodEnd: new Date(periodEnd * 1000) }),
    },
    { new: true },
  )

  if (!sub) {
    log.warn({ stripeSubscriptionId: subscription.id, errorCode: 'SUB_UPDATE_NOT_FOUND' }, 'subscription not found for update')
    return
  }

  log.info({ stripeSubscriptionId: subscription.id, orgId: sub.orgId, status: subscription.status, periodStart, periodEnd }, 'subscription updated')
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    { stripeStatus: 'canceled' },
    { new: true },
  )

  if (!sub) {
    log.warn({ stripeSubscriptionId: subscription.id, errorCode: 'SUB_DELETE_NOT_FOUND' }, 'subscription not found for deletion')
    return
  }

  log.info({ stripeSubscriptionId: subscription.id, orgId: sub.orgId }, 'subscription canceled')
}
