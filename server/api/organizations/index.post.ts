import { Organization, OrgMember, Subscription } from '../../database/models'
import { getStripe } from '../../utils/stripe'
import { isSelfHosted } from '../../utils/deployment'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const log = useRequestLog(event, 'api.organizations')
  const body = await readBody(event)

  if (!body?.name) {
    throw createError({ statusCode: 400, message: 'Nom requis' })
  }

  // Generate slug from name
  const baseSlug = body.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Ensure slug is unique
  let slug = baseSlug
  let attempt = 0
  while (await Organization.findOne({ slug }).lean()) {
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  const org = await Organization.create({
    name: body.name,
    slug,
    ownerId: userId,
  })

  await OrgMember.create({
    orgId: org._id,
    userId,
    role: 'owner',
  })

  // Create subscription (skip in self-hosted)
  if (!isSelfHosted()) {
    let stripeCustomerId: string | null = null
    const stripe = getStripe()
    if (stripe) {
      try {
        const { User } = await import('../../database/models')
        const user = await User.findById(userId).lean()
        if (user) {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: { userId, orgId: org._id.toString() },
          })
          stripeCustomerId = customer.id
        }
      } catch {
        // Non-blocking
      }
    }

    try {
      await Subscription.create({
        orgId: org._id,
        stripeStatus: 'trialing',
        ...(stripeCustomerId && { stripeCustomerId }),
      })
    } catch (err) {
      log.warn({ orgId: org._id, errorCode: 'SUB_CREATE_FAILED', error: (err as Error).message }, 'subscription creation failed')
    }
  }

  log.info({ userId, orgId: org._id, orgName: org.name }, 'organization created')

  return org
})
