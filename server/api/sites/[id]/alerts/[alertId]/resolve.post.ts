import { Alert } from '../../../../../database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const alertId = requireValidId(event, 'alertId')
  await requireSiteAccess(event, siteId, 'member')

  const alert = await Alert.findOneAndUpdate(
    { _id: alertId, siteId, status: 'open' },
    { status: 'resolved', resolvedAt: new Date(), resolvedBy: 'user' },
    { new: true },
  ).lean()

  if (!alert) {
    throw createError({ statusCode: 404, message: 'Alerte non trouvée ou déjà résolue' })
  }

  return alert
})
