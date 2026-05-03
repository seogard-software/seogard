import { Alert } from '../../../../database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  await requireSiteOrAnyZoneAccess(event, siteId, 'member')

  const body = await readBody(event) || {}
  if (!body.ruleId || typeof body.ruleId !== 'string') {
    throw createError({ statusCode: 400, message: 'ruleId requis' })
  }

  const { modifiedCount } = await Alert.updateMany(
    { siteId, ruleId: body.ruleId, status: 'open' },
    { status: 'resolved', resolvedAt: new Date(), resolvedBy: 'user' },
  )

  return { resolved: modifiedCount }
})
