import { MonitoredPage } from '~~/server/database/models'
import { patternsToRegex, isValidPattern, normalizePattern } from '~~/shared/utils/zone'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  await requireSiteAccess(event, siteId, 'viewer')

  const query = getQuery(event)

  // patterns[] can be a string or array
  let patterns: string[]
  if (Array.isArray(query['patterns[]'])) {
    patterns = query['patterns[]'] as string[]
  }
  else if (typeof query['patterns[]'] === 'string') {
    patterns = [query['patterns[]']]
  }
  else if (Array.isArray(query.patterns)) {
    patterns = query.patterns as string[]
  }
  else if (typeof query.patterns === 'string') {
    patterns = [query.patterns]
  }
  else {
    throw createError({ statusCode: 400, message: 'Le paramètre patterns est requis' })
  }

  for (const p of patterns) {
    if (!isValidPattern(p)) {
      throw createError({ statusCode: 400, message: `Pattern invalide : "${p}"` })
    }
  }

  patterns = patterns.map(normalizePattern)
  const regex = patternsToRegex(patterns)

  const pageCount = await MonitoredPage.countDocuments({
    siteId,
    pathname: { $regex: regex },
  })

  return { pageCount }
})
