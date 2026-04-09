import { Organization } from '../../database/models'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.email || typeof body.email !== 'string') {
    throw createError({ statusCode: 400, message: 'Email requis' })
  }

  const parts = body.email.split('@')
  if (parts.length !== 2 || !parts[1]) {
    throw createError({ statusCode: 400, message: 'Email invalide' })
  }

  const domain = parts[1].toLowerCase()

  const orgs = await Organization.find({
    allowedDomains: domain,
    ssoProvider: 'saml',
  }, { name: 1, slug: 1, enforceSSO: 1 }).lean()

  return {
    samlOrgs: orgs.map((org) => ({
      name: org.name as string,
      slug: org.slug as string,
      enforceSSO: Boolean((org as any).enforceSSO),
    })),
  }
})
