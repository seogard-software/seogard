import { SAML } from '@node-saml/node-saml'
import { Organization } from '../../../../database/models'

export default defineEventHandler(async (event) => {
  const orgSlug = getRouterParam(event, 'orgSlug')
  if (!orgSlug) {
    throw createError({ statusCode: 400, message: 'Organisation requise' })
  }

  const org = await Organization.findOne({ slug: orgSlug }).lean() as any
  if (!org || org.ssoProvider !== 'saml') {
    throw createError({ statusCode: 404, message: 'SSO SAML non configuré pour cette organisation' })
  }

  if (!org.samlEntryPoint || !org.samlCertificate) {
    throw createError({ statusCode: 500, message: 'Configuration SAML incomplète' })
  }

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const saml = new SAML({
    entryPoint: org.samlEntryPoint,
    issuer: org.samlIssuer || `${appUrl}/api/auth/saml/${orgSlug}/metadata`,
    callbackUrl: `${appUrl}/api/auth/saml/${orgSlug}/callback`,
    idpCert: org.samlCertificate,
    wantAssertionsSigned: true,
  })

  const loginUrl = await saml.getAuthorizeUrlAsync('', undefined, {})

  return sendRedirect(event, loginUrl)
})
