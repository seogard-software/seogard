import { MutedRule } from '../../../../database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  await requireSiteOrAnyZoneAccess(event, siteId, 'admin')

  const ruleId = getRouterParam(event, 'ruleId')
  if (!ruleId) {
    throw createError({ statusCode: 400, message: 'ruleId requis' })
  }

  const result = await MutedRule.deleteOne({ siteId, ruleId })

  if (result.deletedCount === 0) {
    throw createError({ statusCode: 404, message: 'Règle non trouvée dans les règles désactivées' })
  }

  return { unmuted: true }
})
