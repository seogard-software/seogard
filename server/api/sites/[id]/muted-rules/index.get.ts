import { MutedRule } from '../../../../database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  await requireSiteAccess(event, siteId, 'viewer')

  const rules = await MutedRule.find({ siteId }).sort({ createdAt: -1 }).lean()

  return { rules }
})
