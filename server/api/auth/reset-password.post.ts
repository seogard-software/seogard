import { User, RefreshToken } from '../../database/models'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.token || typeof body.token !== 'string') {
    throw createError({ statusCode: 400, message: 'Token requis' })
  }
  if (!body?.password || typeof body.password !== 'string' || body.password.length < 8) {
    throw createError({ statusCode: 400, message: 'Mot de passe requis (8 caractères minimum)' })
  }

  const user = await User.findOne({
    passwordResetToken: body.token,
    passwordResetExpiresAt: { $gt: new Date() },
  })

  if (!user) {
    throw createError({ statusCode: 400, message: 'Lien expiré ou invalide. Demandez un nouveau lien.' })
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
