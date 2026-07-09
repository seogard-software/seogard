import { User, RefreshToken } from '../../database/models'
import { hashPassword, generateAccessToken, generateRefreshTokenValue, setAuthCookies, getRefreshTokenExpiresAt } from '../../utils/auth'
import { sendWelcomeEmail } from '../../utils/email'
import { createPersonalOrg } from '../../utils/org-create'
import { isSelfHosted } from '../../utils/deployment'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.auth')

  // Self-hosted: registration is only allowed for the first user (owner)
  if (isSelfHosted()) {
    const userCount = await User.countDocuments()
    if (userCount > 0) {
      throw createError({ statusCode: 403, message: 'Registration disabled. Contact the administrator for an invitation.', data: { errorCode: 'REGISTRATION_DISABLED' } })
    }
  }

  const body = await readBody(event)

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, message: 'Email and password required', data: { errorCode: 'CREDENTIALS_REQUIRED' } })
  }

  if (body.password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters', data: { errorCode: 'PASSWORD_TOO_SHORT' } })
  }

  if (!body.acceptedTerms) {
    throw createError({ statusCode: 400, message: 'Terms of service must be accepted', data: { errorCode: 'TERMS_NOT_ACCEPTED' } })
  }

  const existing = await User.findOne({ email: body.email }).lean()

  if (existing) {
    throw createError({ statusCode: 409, message: 'Email already in use', data: { errorCode: 'EMAIL_ALREADY_USED' } })
  }

  const passwordHash = await hashPassword(body.password)

  const CURRENT_TERMS_VERSION = '2026-03-18'

  // Locale du compte : dérivée de l'en-tête Accept-Language du navigateur à l'inscription
  const acceptLanguage = getHeader(event, 'accept-language') ?? ''
  const locale = acceptLanguage.trim().toLowerCase().startsWith('en') ? 'en' : 'fr'

  const user = await User.create({
    email: body.email,
    passwordHash,
    authProvider: 'local',
    locale,
    trialEndsAt: isSelfHosted() ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    acceptedTermsAt: new Date(),
    acceptedTermsVersion: CURRENT_TERMS_VERSION,
  })

  if (!user) throw createError({ statusCode: 500, message: 'Database insert failed', data: { errorCode: 'INTERNAL_ERROR' } })

  const orgName = body.orgName?.trim() || body.email.split('@')[0]

  // Orga perso (organisation + membership owner + subscription trial + client Stripe) via la SOURCE
  // UNIQUE partagée (org-create), comme l'onboarding /api/organizations et l'inscription OAuth.
  // createPersonalOrg nettoie son orga partielle si ça échoue ; ici on retire l'utilisateur pour
  // ne pas laisser de compte orphelin.
  let org
  try {
    org = await createPersonalOrg({ userId: user._id.toString(), name: orgName, email: body.email })
  }
  catch (err) {
    await User.deleteOne({ _id: user._id }).catch(e => log.error({ error: (e as Error).message }, 'cleanup failed'))
    log.error({ userId: user._id, errorCode: 'REGISTER_ROLLBACK', error: (err as Error).message }, 'registration rollback after org creation failure')
    throw createError({ statusCode: 500, message: 'Account creation failed', data: { errorCode: 'REGISTRATION_FAILED' } })
  }

  const accessToken = generateAccessToken(user._id.toString())
  const refreshTokenValue = generateRefreshTokenValue()

  await RefreshToken.create({
    userId: user._id,
    token: refreshTokenValue,
    expiresAt: getRefreshTokenExpiresAt(),
  })

  setAuthCookies(event, accessToken, refreshTokenValue)

  log.info({ userId: user._id, email: user.email, orgId: org._id }, 'user registered')

  sendWelcomeEmail(user.email, user._id.toString(), user.locale)

  return {
    user: {
      _id: user._id,
      email: user.email,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null,
      authProvider: user.authProvider ?? 'local',
    },
  }
})
