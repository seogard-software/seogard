import { User } from '../../../database/models'
import { verifyTotpCode } from '../../../utils/totp'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const body = await readBody(event)

  if (!body?.code) {
    throw createError({ statusCode: 400, message: 'Code requis' })
  }

  const user = await User.findById(userId).select('totpSecret totpEnabled')
  if (!user) throw createError({ statusCode: 404, message: 'Utilisateur non trouvé' })

  if (!user.totpEnabled || !user.totpSecret) {
    throw createError({ statusCode: 400, message: '2FA non active' })
  }

  const valid = verifyTotpCode(user.totpSecret, body.code)
  if (!valid) {
    throw createError({ statusCode: 400, message: 'Code invalide' })
  }

  await User.updateOne({ _id: userId }, {
    totpEnabled: false,
    totpSecret: null,
    backupCodes: [],
  })

  const log = useRequestLog(event, 'api.auth')
  log.info({ userId }, '2FA disabled')

  return { success: true }
})
