export type OrgRole = 'owner' | 'member'
export type SsoProvider = 'saml' | null

export interface Organization {
  _id: string
  name: string
  slug: string
  ownerId: string
  logoUrl: string | null
  ssoProvider: SsoProvider
  samlEntryPoint: string | null
  samlCertificate: string | null
  samlIssuer: string | null
  enforceSSO: boolean
  allowedDomains: string[]
  createdAt: string
  updatedAt: string
}

export interface ZoneRoleEntry {
  zoneId: string
  role: 'admin' | 'member' | 'viewer'
}

export interface OrgMember {
  _id: string
  orgId: string
  userId: string
  role: OrgRole
  zoneRoles: ZoneRoleEntry[]
  user?: { _id: string; email: string; name: string | null; avatarUrl: string | null }
  joinedAt: string
}

export interface OrgInvite {
  _id: string
  orgId: string
  email: string
  role: 'member'
  zoneId: string | null
  zoneRole: 'admin' | 'member' | 'viewer' | null
  invitedBy: string
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: string
  createdAt: string
}

export interface UserOrganization {
  _id: string
  name: string
  slug: string
  role: OrgRole
}
