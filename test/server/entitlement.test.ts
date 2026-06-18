import { describe, it, expect, vi, beforeEach } from 'vitest'

// canOrgUseCrawls = source unique de l'entitlement crawl (CTA dashboard + crawl auto scan).
// On mocke isSelfHosted + les models ; canUseCrawls (pur) reste réel.
const isSelfHosted = vi.fn()
const subFindOne = vi.fn()
const orgFindById = vi.fn()
const userFindById = vi.fn()

vi.mock('../../server/utils/deployment', () => ({
  isSelfHosted: (...a: unknown[]) => isSelfHosted(...a),
}))
vi.mock('../../server/database/models', () => ({
  Subscription: { findOne: (...a: unknown[]) => subFindOne(...a) },
  Organization: { findById: (...a: unknown[]) => orgFindById(...a) },
  User: { findById: (...a: unknown[]) => userFindById(...a) },
}))

const leanChain = (result: unknown) => ({ lean: () => Promise.resolve(result) })
const selectLeanChain = (result: unknown) => ({ select: () => ({ lean: () => Promise.resolve(result) }) })

describe('canOrgUseCrawls — entitlement orga (trial du owner)', () => {
  beforeEach(() => {
    isSelfHosted.mockReset()
    subFindOne.mockReset()
    orgFindById.mockReset()
    userFindById.mockReset()
  })

  it('self-hosted → toujours autorisé, aucune requête DB', async () => {
    isSelfHosted.mockReturnValueOnce(true)
    const { canOrgUseCrawls } = await import('../../server/utils/entitlement')
    expect(await canOrgUseCrawls('org1')).toBe(true)
    expect(subFindOne).not.toHaveBeenCalled()
  })

  it('pas d abonnement → refusé', async () => {
    isSelfHosted.mockReturnValueOnce(false)
    subFindOne.mockReturnValueOnce(leanChain(null))
    const { canOrgUseCrawls } = await import('../../server/utils/entitlement')
    expect(await canOrgUseCrawls('org1')).toBe(false)
  })

  it('abonnement actif → autorisé', async () => {
    isSelfHosted.mockReturnValueOnce(false)
    subFindOne.mockReturnValueOnce(leanChain({ stripeStatus: 'active' }))
    const { canOrgUseCrawls } = await import('../../server/utils/entitlement')
    expect(await canOrgUseCrawls('org1')).toBe(true)
  })

  it('trial en cours (date future) → autorisé', async () => {
    isSelfHosted.mockReturnValueOnce(false)
    subFindOne.mockReturnValueOnce(leanChain({ stripeStatus: 'trialing' }))
    orgFindById.mockReturnValueOnce(selectLeanChain({ ownerId: 'u1' }))
    userFindById.mockReturnValueOnce(selectLeanChain({ trialEndsAt: new Date(Date.now() + 86_400_000) }))
    const { canOrgUseCrawls } = await import('../../server/utils/entitlement')
    expect(await canOrgUseCrawls('org1')).toBe(true)
  })

  it('trial expiré → refusé', async () => {
    isSelfHosted.mockReturnValueOnce(false)
    subFindOne.mockReturnValueOnce(leanChain({ stripeStatus: 'trialing' }))
    orgFindById.mockReturnValueOnce(selectLeanChain({ ownerId: 'u1' }))
    userFindById.mockReturnValueOnce(selectLeanChain({ trialEndsAt: new Date(Date.now() - 1_000) }))
    const { canOrgUseCrawls } = await import('../../server/utils/entitlement')
    expect(await canOrgUseCrawls('org1')).toBe(false)
  })

  it('trial sans date (owner sans trialEndsAt) → refusé', async () => {
    isSelfHosted.mockReturnValueOnce(false)
    subFindOne.mockReturnValueOnce(leanChain({ stripeStatus: 'trialing' }))
    orgFindById.mockReturnValueOnce(selectLeanChain({ ownerId: 'u1' }))
    userFindById.mockReturnValueOnce(selectLeanChain(null))
    const { canOrgUseCrawls } = await import('../../server/utils/entitlement')
    expect(await canOrgUseCrawls('org1')).toBe(false)
  })
})
