import { Organization } from '../../../../database/models'

export default defineEventHandler(async (event) => {
  const orgSlug = getRouterParam(event, 'orgSlug')
  if (!orgSlug) {
    throw createError({ statusCode: 400, message: 'Organisation requise' })
  }

  const org = await Organization.findOne({ slug: orgSlug }).lean() as any
  if (!org) {
    throw createError({ statusCode: 404, message: 'Organisation non trouvée' })
  }

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const entityId = org.samlIssuer || `${appUrl}/api/auth/saml/${orgSlug}/metadata`
  const acsUrl = `${appUrl}/api/auth/saml/${orgSlug}/callback`

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${entityId}">
  <SPSSODescriptor AuthnRequestsSigned="false"
    WantAssertionsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${acsUrl}"
      index="1"
      isDefault="true" />
  </SPSSODescriptor>
</EntityDescriptor>`

  setResponseHeader(event, 'content-type', 'application/xml')
  return xml
})
