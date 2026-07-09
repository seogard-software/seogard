import { User } from '../../../database/models'
import { verifyTotpCode, generateBackupCodes, hashBackupCode } from '../../../utils/totp'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const body = await readBody(event)

  if (!body?.code) {
    throw createError({ statusCode: 400, message: 'Code required', data: { errorCode: 'CODE_REQUIRED' } })
  }

  const user = await User.findById(userId).select('totpSecret totpEnabled')
  if (!user) throw createError({ statusCode: 404, message: 'User not found', data: { errorCode: 'USER_NOT_FOUND' } })

  if (user.totpEnabled) {
    throw createError({ statusCode: 400, message: '2FA already enabled', data: { errorCode: 'TOTP_ALREADY_ENABLED' } })
  }

  if (!user.totpSecret) {
    throw createError({ statusCode: 400, message: 'Run 2FA setup first', data: { errorCode: 'TOTP_SETUP_REQUIRED' } })
  }

  const valid = verifyTotpCode(user.totpSecret, body.code)
  if (!valid) {
    throw createError({ statusCode: 400, message: 'Invalid code', data: { errorCode: 'CODE_INVALID' } })
  }

  const backupCodes = generateBackupCodes()
  const hashedCodes = backupCodes.map(hashBackupCode)

  await User.updateOne({ _id: userId }, {
    totpEnabled: true,
    backupCodes: hashedCodes,
  })

  const log = useRequestLog(event, 'api.auth')
  log.info({ userId }, '2FA enabled')

  return { backupCodes }
})
