import QRCode from 'qrcode'
import { User } from '../../../database/models'
import { generateTotpSecret, getTotpUri } from '../../../utils/totp'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)

  const user = await User.findById(userId).select('email totpEnabled').lean()
  if (!user) throw createError({ statusCode: 404, message: 'User not found', data: { errorCode: 'USER_NOT_FOUND' } })

  if (user.totpEnabled) {
    throw createError({ statusCode: 400, message: '2FA already enabled', data: { errorCode: 'TOTP_ALREADY_ENABLED' } })
  }

  const secret = generateTotpSecret()

  // Store secret temporarily (not enabled yet until verified)
  await User.updateOne({ _id: userId }, { totpSecret: secret })

  const uri = getTotpUri(secret, user.email)
  const qrCodeDataUrl = await QRCode.toDataURL(uri)

  return { uri, qrCodeDataUrl }
})
