import { OrgInvite, Organization, User, Zone } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({ statusCode: 400, message: 'Token manquant' })
  }

  const invite = await OrgInvite.findOne({ token, status: 'pending' })
  if (!invite) {
    throw createError({ statusCode: 404, message: 'Invitation non trouvée ou déjà utilisée' })
  }

  if (invite.expiresAt && new Date() > invite.expiresAt) {
    invite.status = 'expired'
    await invite.save()
    throw createError({ statusCode: 410, message: 'Cette invitation a expiré' })
  }

  const org = await Organization.findById(invite.orgId).select('name').lean()
  const hasAccount = !!(await User.findOne({ email: invite.email }).select('_id').lean())

  let zoneName: string | null = null
  if (invite.zoneId) {
    const zone = await Zone.findById(invite.zoneId).select('name isDefault').lean()
    zoneName = (zone as any)?.isDefault ? 'Toutes les pages' : ((zone as any)?.name ?? null)
  }

  return {
    email: invite.email,
    orgName: org?.name ?? 'Organisation',
    role: invite.zoneRole ?? invite.role,
    zoneName,
    hasAccount,
  }
})
