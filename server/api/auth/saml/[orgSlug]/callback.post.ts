import { SAML } from '@node-saml/node-saml'
import { Organization, User, OrgMember, RefreshToken } from '../../../../database/models'
import { generateAccessToken, generateRefreshTokenValue, setAuthCookies, getRefreshTokenExpiresAt } from '../../../../utils/auth'
import { isSelfHosted } from '../../../../utils/deployment'
import { createLogger } from '../../../../utils/logger'

const log = createLogger('web', 'api.auth.saml')

export default defineEventHandler(async (event) => {
  const orgSlug = getRouterParam(event, 'orgSlug')
  if (!orgSlug) {
    throw createError({ statusCode: 400, message: 'Organisation requise' })
  }

  const org = await Organization.findOne({ slug: orgSlug }).lean() as any
  if (!org || org.ssoProvider !== 'saml') {
    throw createError({ statusCode: 404, message: 'SSO SAML non configuré' })
  }

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const saml = new SAML({
    entryPoint: org.samlEntryPoint,
    issuer: org.samlIssuer || `${appUrl}/api/auth/saml/${orgSlug}/metadata`,
    callbackUrl: `${appUrl}/api/auth/saml/${orgSlug}/callback`,
    idpCert: org.samlCertificate,
    wantAssertionsSigned: true,
  })

  const body = await readBody(event)
  const samlResponse = body?.SAMLResponse

  if (!samlResponse) {
    throw createError({ statusCode: 400, message: 'SAMLResponse manquant' })
  }

  let profile: any
  try {
    const result = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse })
    profile = result.profile
  } catch (err) {
    log.error({ orgSlug, errorCode: 'SAML_VALIDATION_FAILED', error: (err as Error).message }, 'SAML response validation failed')
    throw createError({ statusCode: 401, message: 'Réponse SAML invalide' })
  }

  const email = profile?.email || (profile?.nameID?.includes('@') ? profile.nameID : null)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Email valide non trouvé dans la réponse SAML' })
  }

  const name = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile?.displayName || null

  // Find or create user
  let user = await User.findOne({ email })

  if (!user) {
    user = await User.create({
      email,
      name,
      authProvider: 'local',
      passwordHash: null,
      trialEndsAt: isSelfHosted() ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    })

    log.info({ userId: user._id, orgSlug }, 'new user created via SAML')
  }

  // Auto-join the SAML org
  const existingMember = await OrgMember.findOne({ orgId: org._id, userId: user._id }).lean()
  if (!existingMember) {
    await OrgMember.create({ orgId: org._id, userId: user._id, role: 'member' })
    log.info({ userId: user._id, orgId: org._id }, 'user auto-joined org via SAML')
  }

  // Issue auth tokens
  const accessToken = generateAccessToken(user._id.toString())
  const refreshTokenValue = generateRefreshTokenValue()

  await RefreshToken.deleteMany({ userId: user._id })
  await RefreshToken.create({
    userId: user._id,
    token: refreshTokenValue,
    expiresAt: getRefreshTokenExpiresAt(),
  })

  setAuthCookies(event, accessToken, refreshTokenValue)

  return sendRedirect(event, `${appUrl}/dashboard/sites`)
})
