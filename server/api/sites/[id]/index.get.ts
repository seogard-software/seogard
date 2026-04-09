import { Site, MonitoredPage, Crawl } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const id = requireValidId(event)
  const { site } = await requireSiteAccess(event, id, 'viewer')

  const [pagesCount, lastCrawl] = await Promise.all([
    MonitoredPage.countDocuments({ siteId: site._id }),
    Crawl.findOne({
      siteId: site._id,
      status: { $in: ['completed', 'running'] },
    }).sort({ createdAt: -1 }).lean(),
  ])

  const lastCrawlAt = site.lastCrawlAt
    ?? (lastCrawl?.completedAt ?? lastCrawl?.createdAt)?.toISOString()
    ?? null

  return { ...site, pagesCount, lastCrawlAt }
})
