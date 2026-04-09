import { Organization } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const orgId = requireValidId(event, 'orgId')
  const { role } = await requireOrgRole(event, orgId, 'owner')
  const body = await readBody(event)

  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = body.name
  if (body.logoUrl !== undefined) update.logoUrl = body.logoUrl
  if (body.allowedDomains !== undefined && Array.isArray(body.allowedDomains)) {
    update.allowedDomains = body.allowedDomains.filter((d: unknown) => typeof d === 'string' && d.length > 0)
  }

  // SSO config — owner only
  if (role === 'owner') {
    if (body.ssoProvider !== undefined) update.ssoProvider = body.ssoProvider
    if (body.samlEntryPoint !== undefined) update.samlEntryPoint = body.samlEntryPoint
    if (body.samlCertificate !== undefined) update.samlCertificate = body.samlCertificate
    if (body.samlIssuer !== undefined) update.samlIssuer = body.samlIssuer
    if (body.enforceSSO !== undefined) update.enforceSSO = body.enforceSSO
  }

  const updated = await Organization.findByIdAndUpdate(orgId, update, { new: true }).lean()
  if (!updated) {
    throw createError({ statusCode: 404, message: 'Organisation non trouvée' })
  }

  return updated
})
