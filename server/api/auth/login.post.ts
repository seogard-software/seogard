import { User, RefreshToken, OrgMember } from '../../database/models'
import { verifyPassword, generateAccessToken, generateRefreshTokenValue, setAuthCookies, getRefreshTokenExpiresAt } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.auth')
  const body = await readBody(event)

  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, message: 'Email et mot de passe requis' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  checkLoginRateLimit(ip, body.email)

  const user = await User.findOne({ email: body.email })

  if (!user) {
    recordFailedLogin(ip, body.email)
    log.warn({ email: body.email, errorCode: 'INVALID_CREDENTIALS' }, 'failed login attempt')
    throw createError({ statusCode: 401, message: 'Email ou mot de passe incorrect' })
  }

  // OAuth-only users cannot login with password
  if (!user.passwordHash) {
    throw createError({ statusCode: 401, message: `Ce compte utilise ${user.authProvider}. Connectez-vous via ce fournisseur.` })
  }

  const valid = await verifyPassword(body.password, user.passwordHash)
  if (!valid) {
    recordFailedLogin(ip, body.email)
    log.warn({ email: body.email, errorCode: 'INVALID_CREDENTIALS' }, 'failed login attempt')
    throw createError({ statusCode: 401, message: 'Email ou mot de passe incorrect' })
  }

  resetLoginAttempts(ip, body.email)

  // Check if user is in an org with enforceSSO
  const memberships = await OrgMember.find({ userId: user._id }).populate('orgId', 'name slug enforceSSO').lean()
  const enforcedOrg = memberships.find((m: any) => m.orgId?.enforceSSO)
  if (enforcedOrg) {
    const orgData = enforcedOrg as any
    throw createError({
      statusCode: 403,
      message: `Votre organisation "${orgData.orgId.name}" exige une connexion SSO`,
      data: { samlUrl: `/api/auth/saml/${orgData.orgId.slug}/login` },
    })
  }

  // Check if 2FA is enabled
  if (user.totpEnabled) {
    const pendingToken = generateAccessToken(user._id.toString())
    setCookie(event, 'totp-pending', pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 5 * 60,
      path: '/',
    })

    log.info({ userId: user._id }, 'login requires 2FA verification')

    return { requiresTwoFactor: true }
  }

  // No 2FA — issue tokens
  const accessToken = generateAccessToken(user._id.toString())
  const refreshTokenValue = generateRefreshTokenValue()

  await RefreshToken.deleteMany({ userId: user._id })
  await RefreshToken.create({
    userId: user._id,
    token: refreshTokenValue,
    expiresAt: getRefreshTokenExpiresAt(),
  })

  setAuthCookies(event, accessToken, refreshTokenValue)

  log.info({ userId: user._id }, 'user logged in')

  return {
    user: {
      _id: user._id,
      email: user.email,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null,
      authProvider: user.authProvider ?? 'local',
      totpEnabled: user.totpEnabled ?? false,
      createdAt: user.createdAt,
    },
  }
})
