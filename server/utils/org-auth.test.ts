import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockOrgMemberFindOne = vi.fn()
const mockSiteFindById = vi.fn()

vi.mock('../database/models', () => ({
  OrgMember: {
    findOne: (...args: unknown[]) => ({ lean: () => mockOrgMemberFindOne(...args) }),
  },
  Site: {
    findById: (...args: unknown[]) => ({ lean: () => mockSiteFindById(...args) }),
  },
}))

vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireAuth', vi.fn(() => 'user123'))

describe('org-auth — hasMinRole', () => {
  let hasMinRole: typeof import('./org-auth').hasMinRole

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./org-auth')
    hasMinRole = mod.hasMinRole
  })

  it('owner >= owner', () => {
    expect(hasMinRole('owner', 'owner')).toBe(true)
  })

  it('owner >= viewer', () => {
    expect(hasMinRole('owner', 'viewer')).toBe(true)
  })

  it('admin >= member', () => {
    expect(hasMinRole('admin', 'member')).toBe(true)
  })

  it('member >= member', () => {
    expect(hasMinRole('member', 'member')).toBe(true)
  })

  it('viewer < member', () => {
    expect(hasMinRole('viewer', 'member')).toBe(false)
  })

  it('viewer < admin', () => {
    expect(hasMinRole('viewer', 'admin')).toBe(false)
  })

  it('member < admin', () => {
    expect(hasMinRole('member', 'admin')).toBe(false)
  })

  it('admin < owner', () => {
    expect(hasMinRole('admin', 'owner')).toBe(false)
  })
})

describe('org-auth — requireOrgRole', () => {
  let requireOrgRole: typeof import('./org-auth').requireOrgRole

  const fakeEvent = { context: { auth: { userId: 'user123' } } } as any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./org-auth')
    requireOrgRole = mod.requireOrgRole
  })

  it('allows owner when admin required', async () => {
    mockOrgMemberFindOne.mockResolvedValue({ role: 'owner' })

    const result = await requireOrgRole(fakeEvent, 'org1', 'admin')

    expect(result.role).toBe('owner')
  })

  it('rejects viewer when member required', async () => {
    mockOrgMemberFindOne.mockResolvedValue({ role: 'viewer' })

    await expect(requireOrgRole(fakeEvent, 'org1', 'member')).rejects.toThrow('Permissions insuffisantes')
  })

  it('rejects non-member', async () => {
    mockOrgMemberFindOne.mockResolvedValue(null)

    await expect(requireOrgRole(fakeEvent, 'org1', 'viewer')).rejects.toThrow('pas membre')
  })
})

describe('org-auth — requireSiteAccess', () => {
  let requireSiteAccess: typeof import('./org-auth').requireSiteAccess

  const fakeEvent = { context: { auth: { userId: 'user123' } } } as any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./org-auth')
    requireSiteAccess = mod.requireSiteAccess
  })

  it('allows member when viewer required', async () => {
    mockSiteFindById.mockResolvedValue({ _id: 'site1', orgId: 'org1' })
    mockOrgMemberFindOne.mockResolvedValue({ role: 'member' })

    const result = await requireSiteAccess(fakeEvent, 'site1', 'viewer')

    expect(result.role).toBe('member')
    expect(result.site._id).toBe('site1')
  })

  it('rejects viewer when admin required', async () => {
    mockSiteFindById.mockResolvedValue({ _id: 'site1', orgId: 'org1' })
    mockOrgMemberFindOne.mockResolvedValue({ role: 'viewer' })

    await expect(requireSiteAccess(fakeEvent, 'site1', 'admin')).rejects.toThrow('Permissions insuffisantes')
  })

  it('rejects when site not found', async () => {
    mockSiteFindById.mockResolvedValue(null)

    await expect(requireSiteAccess(fakeEvent, 'nonexistent', 'viewer')).rejects.toThrow('non trouvé')
  })

  it('rejects when user is not org member', async () => {
    mockSiteFindById.mockResolvedValue({ _id: 'site1', orgId: 'org1' })
    mockOrgMemberFindOne.mockResolvedValue(null)

    await expect(requireSiteAccess(fakeEvent, 'site1', 'viewer')).rejects.toThrow('non trouvé')
  })
})
