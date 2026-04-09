import { Site, MonitoredPage, Crawl } from '../../database/models'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const orgId = getOrgIdFromHeader(event)
  await requireOrgRole(event, orgId, 'viewer')

  const sites = await Site.find({ orgId }).sort({ createdAt: 1 }).lean()
  const siteIds = sites.map(s => s._id)

  const [counts, latestCrawls] = await Promise.all([
    MonitoredPage.aggregate<{ _id: string; count: number }>([
      { $match: { siteId: { $in: siteIds } } },
      { $group: { _id: '$siteId', count: { $sum: 1 } } },
    ]),
    Crawl.aggregate<{ _id: string; status: string; createdAt: Date; completedAt: Date | null }>([
      { $match: { siteId: { $in: siteIds }, status: { $in: ['completed', 'running'] } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$siteId', status: { $first: '$status' }, createdAt: { $first: '$createdAt' }, completedAt: { $first: '$completedAt' } } },
    ]),
  ])

  const countMap = new Map(counts.map(c => [c._id.toString(), c.count]))
  const crawlMap = new Map(latestCrawls.map(c => [c._id.toString(), c]))

  return sites.map((site) => {
    const latestCrawl = crawlMap.get(site._id.toString())
    const lastCrawlAt = site.lastCrawlAt
      ?? (latestCrawl?.completedAt ?? latestCrawl?.createdAt)?.toISOString()
      ?? null
    return {
      ...site,
      pagesCount: countMap.get(site._id.toString()) ?? 0,
      lastCrawlAt,
      crawlStatus: latestCrawl?.status ?? null,
    }
  })
})
