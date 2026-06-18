import { Organization, OrgMember, Subscription, User } from '../database/models'
import { getStripe } from './stripe'
import { isSelfHosted } from './deployment'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Crée une orga perso complète : organisation + membership owner + abonnement trial (+ client
// Stripe). SOURCE UNIQUE réutilisée par l'onboarding (/api/organizations) ET l'auto-création
// OAuth (callback) pour un nouvel inscrit sans orga. Le client Stripe et la subscription sont
// non bloquants (un échec n'empêche pas la création de l'orga).
export async function createPersonalOrg(opts: { userId: string, name: string, email?: string | null }) {
  const base = slugify(opts.name) || 'org'
  let slug = base
  let attempt = 0
  while (await Organization.findOne({ slug }).lean()) {
    attempt++
    slug = `${base}-${attempt}`
  }

  const org = await Organization.create({ name: opts.name, slug, ownerId: opts.userId })
  try {
    await OrgMember.create({ orgId: org._id, userId: opts.userId, role: 'owner' })
  }
  catch (err) {
    // Membership KO → on supprime l'orga partielle (pas d'orga orpheline) avant de propager.
    await Organization.deleteOne({ _id: org._id }).catch(() => {})
    throw err
  }

  if (!isSelfHosted()) {
    let stripeCustomerId: string | null = null
    const stripe = getStripe()
    if (stripe) {
      try {
        const email = opts.email ?? (await User.findById(opts.userId).lean())?.email
        if (email) {
          const customer = await stripe.customers.create({
            email,
            metadata: { userId: opts.userId, orgId: org._id.toString() },
          })
          stripeCustomerId = customer.id
        }
      }
      catch { /* non bloquant */ }
    }

    try {
      await Subscription.create({
        orgId: org._id,
        stripeStatus: 'trialing',
        ...(stripeCustomerId && { stripeCustomerId }),
      })
    }
    catch { /* non bloquant */ }
  }

  return org
}
