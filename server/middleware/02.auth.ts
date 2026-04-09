import { RefreshToken } from '../database/models'
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME, verifyAccessToken, generateAccessToken, setAuthCookies } from '../utils/auth'
import { createLogger } from '../utils/logger'

const log = createLogger('web', 'auth.middleware')
const PUBLIC_API_ROUTES = ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/totp/verify', '/api/auth/check-email', '/api/auth/providers', '/api/auth/oauth', '/api/auth/saml', '/api/auth/invite', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/setup/', '/api/webhooks', '/api/stripe/webhook', '/api/public/']

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/api/')) return
  if (PUBLIC_API_ROUTES.some(route => path.startsWith(route))) return

  // 1. Try access token
  const accessToken = getCookie(event, AUTH_COOKIE_NAME)
  if (accessToken) {
    const payload = verifyAccessToken(accessToken)
    if (payload) {
      event.context.auth = { userId: payload.userId }
      return
    }
  }

  // 2. Access token expired or missing — try refresh
  const refreshToken = getCookie(event, REFRESH_COOKIE_NAME)
  if (refreshToken) {
    const doc = await RefreshToken.findOne({
      token: refreshToken,
      expiresAt: { $gt: new Date() },
    }).lean()

    if (doc) {
      const newAccessToken = generateAccessToken(doc.userId.toString())
      setCookie(event, AUTH_COOKIE_NAME, newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'lax',
        maxAge: 5 * 60,
        path: '/',
      })
      event.context.auth = { userId: doc.userId.toString() }
      log.info({ userId: doc.userId.toString(), path: getRequestURL(event).pathname }, 'access token refreshed via refresh token')
      return
    }
  }

  // 3. Nothing valid
  throw createError({ statusCode: 401, message: 'Non authentifie' })
})
