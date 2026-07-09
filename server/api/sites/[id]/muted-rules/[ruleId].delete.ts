import { MutedRule } from '../../../../database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  await requireSiteOrAnyZoneAccess(event, siteId, 'admin')

  const ruleId = getRouterParam(event, 'ruleId')
  if (!ruleId) {
    throw createError({ statusCode: 400, message: 'ruleId required', data: { errorCode: 'RULE_ID_REQUIRED' } })
  }

  const result = await MutedRule.deleteOne({ siteId, ruleId })

  if (result.deletedCount === 0) {
    throw createError({ statusCode: 404, message: 'Rule not found in muted rules', data: { errorCode: 'MUTED_RULE_NOT_FOUND' } })
  }

  return { unmuted: true }
})
