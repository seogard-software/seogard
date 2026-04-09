import { Organization } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const orgId = requireValidId(event, 'orgId')
  const { role } = await requireOrgRole(event, orgId, 'viewer')

  const org = await Organization.findById(orgId).lean() as any
  if (!org) {
    throw createError({ statusCode: 404, message: 'Organisation non trouvée' })
  }

  // Strip sensitive SAML fields for non-owners
  if (role !== 'owner') {
    delete org.samlEntryPoint
    delete org.samlCertificate
    delete org.samlIssuer
  }

  return org
})
