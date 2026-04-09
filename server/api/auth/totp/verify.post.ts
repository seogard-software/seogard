import { User, RefreshToken } from '../../../database/models'
import { verifyAccessToken, generateAccessToken, generateRefreshTokenValue, setAuthCookies, getRefreshTokenExpiresAt } from '../../../utils/auth'
import { verifyTotpCode, hashBackupCode } from '../../../utils/totp'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.auth')
  const body = await readBody(event)

  if (!body?.code) {
    throw createError({ statusCode: 400, message: 'Code requis' })
  }

  // Read pending token from cookie
  const pendingToken = getCookie(event, 'totp-pending')
  if (!pendingToken) {
    throw createError({ statusCode: 401, message: 'Session de vérification expirée. Reconnectez-vous.' })
  }

  const payload = verifyAccessToken(pendingToken)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Session de vérification expirée. Reconnectez-vous.' })
  }

  const user = await User.findById(payload.userId).select('email totpSecret totpEnabled backupCodes')
  if (!user || !user.totpEnabled || !user.totpSecret) {
    throw createError({ statusCode: 400, message: '2FA non configuré' })
  }

  // Try TOTP code first
  let verified = verifyTotpCode(user.totpSecret, body.code)

  // Try backup code if TOTP fails
  if (!verified) {
    const hashedInput = hashBackupCode(body.code)
    const backupIndex = user.backupCodes.indexOf(hashedInput)
    if (backupIndex !== -1) {
      verified = true
      user.backupCodes.splice(backupIndex, 1)
      await User.updateOne({ _id: user._id }, { backupCodes: user.backupCodes })
      log.info({ userId: user._id }, '2FA backup code used')
    }
  }

  if (!verified) {
    throw createError({ statusCode: 401, message: 'Code invalide' })
  }

  // Clear pending cookie
  deleteCookie(event, 'totp-pending', { path: '/' })

  // Issue real tokens
  const accessToken = generateAccessToken(user._id.toString())
  const refreshTokenValue = generateRefreshTokenValue()

  await RefreshToken.deleteMany({ userId: user._id })
  await RefreshToken.create({
    userId: user._id,
    token: refreshTokenValue,
    expiresAt: getRefreshTokenExpiresAt(),
  })

  setAuthCookies(event, accessToken, refreshTokenValue)

  log.info({ userId: user._id }, 'user logged in with 2FA')

  return {
    user: {
      _id: user._id,
      email: user.email,
      totpEnabled: user.totpEnabled,
      createdAt: user.createdAt,
    },
  }
})
