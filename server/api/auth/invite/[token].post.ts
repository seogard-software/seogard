import { OrgInvite, OrgMember, User, RefreshToken } from '../../../database/models'
import { AUTH_COOKIE_NAME, hashPassword, verifyAccessToken, generateAccessToken, generateRefreshTokenValue, setAuthCookies, getRefreshTokenExpiresAt } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.auth')
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, message: 'Token required', data: { errorCode: 'TOKEN_REQUIRED' } })
  }

  const invite = await OrgInvite.findOne({ token, status: 'pending' })
  if (!invite) {
    throw createError({ statusCode: 404, message: 'Invitation not found or already used', data: { errorCode: 'INVITE_NOT_FOUND' } })
  }

  if (invite.expiresAt && new Date() > invite.expiresAt) {
    invite.status = 'expired'
    await invite.save()
    throw createError({ statusCode: 410, message: 'Invitation expired', data: { errorCode: 'INVITE_EXPIRED' } })
  }

  let userId: string

  // Manually check auth (middleware skips public routes)
  let authUserId: string | null = null
  const accessToken = getCookie(event, AUTH_COOKIE_NAME)
  if (accessToken) {
    const payload = verifyAccessToken(accessToken)
    if (payload) authUserId = payload.userId
  }

  // Case 1: Already authenticated
  if (authUserId) {
    const authUser = await User.findById(authUserId).select('email').lean()
    if (!authUser) {
      throw createError({ statusCode: 404, message: 'User not found', data: { errorCode: 'USER_NOT_FOUND' } })
    }
    if (authUser.email !== invite.email) {
      throw createError({ statusCode: 403, message: 'Invitation intended for another email', data: { errorCode: 'INVITE_EMAIL_MISMATCH' } })
    }
    userId = authUserId
  } else {
    // Case 2 & 3: Not authenticated
    const existingUser = await User.findOne({ email: invite.email })

    if (existingUser) {
      // Case 2: Account exists → auto-login (magic link = email proof)
      userId = existingUser._id.toString()

      const accessToken = generateAccessToken(userId)
      const refreshTokenValue = generateRefreshTokenValue()

      await RefreshToken.deleteMany({ userId: existingUser._id })
      await RefreshToken.create({
        userId: existingUser._id,
        token: refreshTokenValue,
        expiresAt: getRefreshTokenExpiresAt(),
      })

      setAuthCookies(event, accessToken, refreshTokenValue)
      log.info({ userId, email: invite.email }, 'auto-login via invite accept')
    } else {
      // Case 3: No account → register (password required)
      const body = await readBody(event)

      if (!body?.password || body.password.length < 8) {
        throw createError({ statusCode: 400, message: 'Password must be at least 8 characters', data: { errorCode: 'PASSWORD_TOO_SHORT' } })
      }

      const passwordHash = await hashPassword(body.password)

      const newUser = await User.create({
        email: invite.email,
        passwordHash,
        authProvider: 'local',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      })

      userId = newUser._id.toString()

      const accessToken = generateAccessToken(userId)
      const refreshTokenValue = generateRefreshTokenValue()

      await RefreshToken.create({
        userId: newUser._id,
        token: refreshTokenValue,
        expiresAt: getRefreshTokenExpiresAt(),
      })

      setAuthCookies(event, accessToken, refreshTokenValue)
      log.info({ userId, email: invite.email, orgId: invite.orgId }, 'user registered via invite accept')
    }
  }

  // Accept invite: create membership if not already a member
  const existing = await OrgMember.findOne({ orgId: invite.orgId, userId })
  if (existing) {
    // Already a member — add zone role if invite has one
    if (invite.zoneId && invite.zoneRole) {
      const hasZoneRole = existing.zoneRoles?.some(
        (zr: any) => zr.zoneId.toString() === invite.zoneId!.toString(),
      )
      if (!hasZoneRole) {
        existing.zoneRoles.push({ zoneId: invite.zoneId, role: invite.zoneRole })
        await existing.save()
      }
    }
    invite.status = 'accepted'
    await invite.save()
    return { success: true, orgId: invite.orgId }
  }

  const zoneRoles = invite.zoneId && invite.zoneRole
    ? [{ zoneId: invite.zoneId, role: invite.zoneRole }]
    : []

  await OrgMember.create({
    orgId: invite.orgId,
    userId,
    role: invite.role,
    zoneRoles,
  })

  invite.status = 'accepted'
  await invite.save()

  log.info({ userId, orgId: invite.orgId, role: invite.role, zoneRole: invite.zoneRole }, 'invite accepted')

  return { success: true, orgId: invite.orgId }
})
