import { MonitoredPage } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const id = requireValidId(event)
  await requireSiteAccess(event, id, 'viewer')

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 100)
  const skip = Math.max(Number(query.skip) || 0, 0)
  const search = typeof query.q === 'string' ? query.q.trim() : ''

  const filter: Record<string, unknown> = { siteId: id }
  if (search) {
    // Escape regex special chars, then search as substring (case-insensitive)
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.url = { $regex: escaped, $options: 'i' }
  }

  const [pages, total] = await Promise.all([
    MonitoredPage.find(filter)
      .sort('url')
      .skip(skip)
      .limit(limit)
      .select('url lastStatusCode lastMeta lastCheckedAt')
      .lean(),
    MonitoredPage.countDocuments(filter),
  ])

  return { pages, total, hasMore: skip + limit < total }
})
