import { User, RefreshToken } from '../../database/models'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.token || typeof body.token !== 'string') {
    throw createError({ statusCode: 400, message: 'Token required', data: { errorCode: 'TOKEN_REQUIRED' } })
  }
  if (!body?.password || typeof body.password !== 'string' || body.password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password required (min 8 characters)', data: { errorCode: 'PASSWORD_TOO_SHORT' } })
  }

  const user = await User.findOne({ passwordResetToken: body.token })

  if (!user) {
    throw createError({ statusCode: 400, message: 'Reset link invalid. Request a new one.', data: { errorCode: 'RESET_TOKEN_INVALID' } })
  }
  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
    throw createError({ statusCode: 400, message: 'Reset link expired. Request a new one.', data: { errorCode: 'RESET_TOKEN_EXPIRED' } })
  }

  // Update password and clear reset token
  const passwordHash = await hashPassword(body.password)
  await User.updateOne(
    { _id: user._id },
    {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  )

  // Invalidate all existing sessions
  await RefreshToken.deleteMany({ userId: user._id })

  return { reset: true }
})
