import { randomBytes } from 'crypto'
import { User } from '../../database/models'
import { sendResetPasswordEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.email || typeof body.email !== 'string') {
    throw createError({ statusCode: 400, message: 'Email requis' })
  }

  const email = body.email.trim().toLowerCase()
  const user = await User.findOne({ email })

  // Always return success to avoid email enumeration
  if (!user || !user.passwordHash) {
    return { sent: true }
  }

  // Generate token (64 hex chars)
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await User.updateOne(
    { _id: user._id },
    { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
  )

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  await sendResetPasswordEmail(email, resetUrl)

  return { sent: true }
})
