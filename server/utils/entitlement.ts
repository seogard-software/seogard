import { Subscription, Organization, User } from '../database/models'
import { canUseCrawls } from '../../shared/utils/pricing'
import { isSelfHosted } from './deployment'

// Un crawl est-il autorisé pour cette ORGA ? Entitlement = l'orga (trial du OWNER), jamais
// l'utilisateur qui clique : sinon un owner expiré pourrait inviter un compte neuf (trial
// frais) et relancer des crawls à l'infini sur la même orga. Self-hosted → toujours autorisé.
// SOURCE UNIQUE : CTA dashboard (zones/[zoneId]/crawl.post) ET crawl auto post-discovery
// (onboarding scan). Imports relatifs → importable depuis le crawler (process tsx, pas de `~~`).
export async function canOrgUseCrawls(orgId: string): Promise<boolean> {
  if (isSelfHosted()) return true

  const sub = await Subscription.findOne({ orgId }).lean()
  if (!sub) return false

  let trialEndsAt: Date | null = null
  if ((sub as { stripeStatus?: string }).stripeStatus === 'trialing') {
    const org = await Organization.findById(orgId).select('ownerId').lean()
    const owner = org ? await User.findById((org as { ownerId: unknown }).ownerId).select('trialEndsAt').lean() : null
    trialEndsAt = (owner as { trialEndsAt?: Date | null } | null)?.trialEndsAt ?? null
  }

  return canUseCrawls((sub as { stripeStatus?: string }).stripeStatus, trialEndsAt)
}
