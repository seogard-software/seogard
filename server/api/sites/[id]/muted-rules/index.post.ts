import { Alert, MutedRule } from '../../../../database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  await requireSiteAccess(event, siteId, 'admin')
  const user = await requireAuth(event)

  const body = await readBody(event) || {}
  if (!body.ruleId || typeof body.ruleId !== 'string') {
    throw createError({ statusCode: 400, message: 'ruleId requis' })
  }

  const ruleId = body.ruleId

  // Create mute (upsert to avoid duplicates)
  await MutedRule.updateOne(
    { siteId, ruleId },
    { $setOnInsert: { siteId, ruleId, mutedBy: user._id } },
    { upsert: true },
  )

  // Resolve all open alerts for this rule on this site
  const { modifiedCount } = await Alert.updateMany(
    { siteId, ruleId, status: 'open' },
    { status: 'resolved', resolvedAt: new Date(), resolvedBy: 'user' },
  )

  return { muted: true, resolved: modifiedCount }
})
