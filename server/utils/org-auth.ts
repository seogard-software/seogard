import type { H3Event } from 'h3'
import mongoose from 'mongoose'
import type { OrgRole } from '~~/shared/types/organization'
import type { ZoneRole } from '~~/shared/types/zone'

type AnyRole = OrgRole | ZoneRole

const ROLE_HIERARCHY: Record<AnyRole, number> = {
  owner: 40,
  admin: 30,
  member: 20,
  viewer: 10,
}

export function hasMinRole(userRole: AnyRole, minRole: AnyRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

export function getOrgIdFromHeader(event: H3Event): string {
  const orgId = getHeader(event, 'x-org-id')
  if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
    throw createError({ statusCode: 400, message: 'x-org-id header manquant ou invalide' })
  }
  return orgId
}

export async function requireOrgRole(event: H3Event, orgId: string, minRole: AnyRole): Promise<{ role: OrgRole }> {
  const userId = requireAuth(event)

  const { OrgMember } = await import('../database/models')
  const member = await OrgMember.findOne({ orgId, userId }).lean()

  if (!member) {
    throw createError({ statusCode: 403, message: 'Vous n\'êtes pas membre de cette organisation' })
  }

  const role = member.role as OrgRole
  if (!hasMinRole(role, minRole)) {
    throw createError({ statusCode: 403, message: 'Permissions insuffisantes' })
  }

  return { role }
}

export async function requireSiteAccess(event: H3Event, siteId: string, minRole: AnyRole): Promise<{ site: any; role: OrgRole }> {
  const userId = requireAuth(event)

  const { Site, OrgMember } = await import('../database/models')
  const site = await Site.findById(siteId).lean()

  if (!site) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  const member = await OrgMember.findOne({ orgId: (site as any).orgId, userId }).lean()

  if (!member) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  const role = member.role as OrgRole
  if (!hasMinRole(role, minRole)) {
    throw createError({ statusCode: 403, message: 'Permissions insuffisantes' })
  }

  return { site, role }
}

/**
 * Like requireSiteAccess but also grants access if the user has the required role on any zone of the site.
 * Useful for site-level resources (like API keys) that zone admins also need.
 */
export async function requireSiteOrAnyZoneAccess(event: H3Event, siteId: string, minRole: AnyRole): Promise<{ site: any; role: AnyRole }> {
  const userId = requireAuth(event)

  const { Site, OrgMember } = await import('../database/models')
  const site = await Site.findById(siteId).lean()

  if (!site) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  const member = await OrgMember.findOne({ orgId: (site as any).orgId, userId }).lean()

  if (!member) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  // Owner bypasses all zone checks. `member` is a membership marker, not a
  // permission grant — they must have a zoneRole to access this resource.
  const orgRole = member.role as OrgRole
  if (orgRole === 'owner') {
    return { site, role: orgRole }
  }

  // Fall back to checking if user has the required role on any zone of this site
  const zoneRoles = (member as any).zoneRoles as { zoneId: any; role: string }[] | undefined
  if (zoneRoles?.some(zr => hasMinRole(zr.role as AnyRole, minRole))) {
    const bestRole = zoneRoles.reduce((best, zr) => {
      const level = ROLE_HIERARCHY[zr.role as AnyRole] ?? 0
      return level > (ROLE_HIERARCHY[best as AnyRole] ?? 0) ? zr.role : best
    }, 'viewer')
    return { site, role: bestRole as AnyRole }
  }

  throw createError({ statusCode: 403, message: 'Permissions insuffisantes' })
}

export async function requireZoneAccess(
  event: H3Event,
  siteId: string,
  zoneId: string,
  minRole: AnyRole,
): Promise<{ site: any; role: AnyRole }> {
  const userId = requireAuth(event)

  const { Site, OrgMember } = await import('../database/models')
  const site = await Site.findById(siteId).lean()

  if (!site) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  const member = await OrgMember.findOne({ orgId: (site as any).orgId, userId }).lean()

  if (!member) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  // Owner org → all access
  if (member.role === 'owner') {
    return { site, role: 'owner' }
  }

  // Check zone-specific role
  const zoneRole = (member as any).zoneRoles?.find(
    (zr: any) => zr.zoneId.toString() === zoneId,
  )?.role as ZoneRole | undefined

  if (!zoneRole) {
    throw createError({ statusCode: 403, message: 'Vous n\'avez pas accès à cette zone' })
  }

  if (!hasMinRole(zoneRole, minRole)) {
    throw createError({ statusCode: 403, message: 'Permissions insuffisantes pour cette zone' })
  }

  return { site, role: zoneRole }
}
