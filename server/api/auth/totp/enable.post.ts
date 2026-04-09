import { User } from '../../../database/models'
import { verifyTotpCode, generateBackupCodes, hashBackupCode } from '../../../utils/totp'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const body = await readBody(event)

  if (!body?.code) {
    throw createError({ statusCode: 400, message: 'Code requis' })
  }

  const user = await User.findById(userId).select('totpSecret totpEnabled')
  if (!user) throw createError({ statusCode: 404, message: 'Utilisateur non trouvé' })

  if (user.totpEnabled) {
    throw createError({ statusCode: 400, message: '2FA déjà activé' })
  }

  if (!user.totpSecret) {
    throw createError({ statusCode: 400, message: 'Lancez le setup 2FA d\'abord' })
  }

  const valid = verifyTotpCode(user.totpSecret, body.code)
  if (!valid) {
    throw createError({ statusCode: 400, message: 'Code invalide' })
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
