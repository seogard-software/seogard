import { RefreshToken } from '../../database/models'
import { REFRESH_COOKIE_NAME, clearAuthCookies } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, REFRESH_COOKIE_NAME)

  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken })
  }

  clearAuthCookies(event)

  return { success: true }
})
