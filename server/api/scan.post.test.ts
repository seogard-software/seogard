import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSiteFindOne = vi.fn()
const mockZoneFindOne = vi.fn()
const mockOrgMemberFind = vi.fn()
const mockCreateSite = vi.fn()
const mockRequireOrgRole = vi.fn()
const mockTriggerSiteCrawl = vi.fn()
const mockCanOrgUseCrawls = vi.fn()

vi.mock('~~/server/database/models', () => ({
  Site: { findOne: (...a: unknown[]) => mockSiteFindOne(...a) },
  Zone: { findOne: (...a: unknown[]) => mockZoneFindOne(...a) },
  OrgMember: { find: (...a: unknown[]) => mockOrgMemberFind(...a) },
}))
vi.mock('~~/server/utils/site-create', () => ({
  createSiteWithDefaultZone: (...a: unknown[]) => mockCreateSite(...a),
}))
vi.mock('~~/server/utils/crawl-trigger', () => ({
  triggerSiteCrawl: (...a: unknown[]) => mockTriggerSiteCrawl(...a),
}))
vi.mock('~~/server/utils/entitlement', () => ({
  canOrgUseCrawls: (...a: unknown[]) => mockCanOrgUseCrawls(...a),
}))

const selLean = (v: unknown) => ({ select: () => ({ lean: () => Promise.resolve(v) }) })

vi.stubGlobal('defineEventHandler', (handler: (e: unknown) => unknown) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number, message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('useRequestLog', vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })))
vi.stubGlobal('requireAuth', vi.fn(() => 'user1'))
vi.stubGlobal('getOrgIdFromHeader', vi.fn(() => 'org1'))
vi.stubGlobal('requireOrgRole', (...a: unknown[]) => mockRequireOrgRole(...a))
vi.stubGlobal('isValidUrl', (url: string) => typeof url === 'string' && url.startsWith('http'))
vi.stubGlobal('normalizeUrl', (url: string) => url.replace(/\/$/, ''))
let body: unknown = {}
vi.stubGlobal('readBody', vi.fn(() => Promise.resolve(body)))

const fakeEvent = {} as unknown

describe('POST /api/scan — onboarding barre Analyser', () => {
  let handler: (e: unknown) => Promise<{ existing?: boolean, created?: boolean, siteId: string, defaultZoneId: string | null, crawlId?: string | null }>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRequireOrgRole.mockResolvedValue({ role: 'owner' })
    mockCanOrgUseCrawls.mockResolvedValue(true)
    mockTriggerSiteCrawl.mockResolvedValue({ _id: 'crawl1' })
    handler = (await import('./scan.post')).default as typeof handler
  })

  it('URL invalide → 400, rien créé', async () => {
    body = { url: 'pas-une-url' }
    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 400 })
    expect(mockCreateSite).not.toHaveBeenCalled()
    expect(mockTriggerSiteCrawl).not.toHaveBeenCalled()
  })

  it('site déjà présent dans une orga de l utilisateur → redirect, AUCUN crawl/création', async () => {
    body = { url: 'https://exemple.fr/' }
    mockOrgMemberFind.mockReturnValueOnce(selLean([{ orgId: 'org1' }, { orgId: 'org2' }]))
    mockSiteFindOne.mockReturnValueOnce(selLean({ _id: 'site1' }))
    mockZoneFindOne.mockReturnValueOnce(selLean({ _id: 'zoneA' }))

    const res = await handler(fakeEvent)

    expect(res).toEqual({ existing: true, siteId: 'site1', defaultZoneId: 'zoneA' })
    expect(mockCreateSite).not.toHaveBeenCalled()
    expect(mockTriggerSiteCrawl).not.toHaveBeenCalled()
    expect(mockRequireOrgRole).not.toHaveBeenCalled()
  })

  it('site nouveau + orga autorisée → owner requis, création + crawl direct, nom = domaine', async () => {
    body = { url: 'https://www.exemple.fr/' }
    mockOrgMemberFind.mockReturnValueOnce(selLean([{ orgId: 'org1' }]))
    mockSiteFindOne.mockReturnValueOnce(selLean(null))
    mockCreateSite.mockResolvedValueOnce({ _id: 'newSite' })
    mockZoneFindOne.mockReturnValueOnce(selLean({ _id: 'zoneB' }))

    const res = await handler(fakeEvent)

    expect(mockRequireOrgRole).toHaveBeenCalledWith(fakeEvent, 'org1', 'owner')
    expect(mockCreateSite).toHaveBeenCalledWith({ orgId: 'org1', name: 'www.exemple.fr', url: 'https://www.exemple.fr' })
    expect(mockTriggerSiteCrawl).toHaveBeenCalledWith('newSite', 'zoneB', 'manual')
    expect(res).toEqual({ created: true, siteId: 'newSite', defaultZoneId: 'zoneB', crawlId: 'crawl1' })
  })

  it('site nouveau mais orga NON autorisée (trial expiré) → site créé, PAS de crawl', async () => {
    body = { url: 'https://exemple.fr' }
    mockOrgMemberFind.mockReturnValueOnce(selLean([{ orgId: 'org1' }]))
    mockSiteFindOne.mockReturnValueOnce(selLean(null))
    mockCreateSite.mockResolvedValueOnce({ _id: 'newSite' })
    mockZoneFindOne.mockReturnValueOnce(selLean({ _id: 'zoneB' }))
    mockCanOrgUseCrawls.mockResolvedValueOnce(false)

    const res = await handler(fakeEvent)

    expect(mockCreateSite).toHaveBeenCalled()
    expect(mockTriggerSiteCrawl).not.toHaveBeenCalled()
    expect(res).toEqual({ created: true, siteId: 'newSite', defaultZoneId: 'zoneB', crawlId: null })
  })
})
