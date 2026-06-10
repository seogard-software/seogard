import { Crawl, CrawlSchedule } from '~~/server/database/models'
import { computeNextCrawlAt } from '~~/shared/utils/crawl-schedule'
import { triggerSiteCrawl } from '~~/server/utils/crawl-trigger'

const log = createLogger('web', 'crawl-scheduler')

export default defineTask({
  meta: {
    name: 'crawl:scheduler',
    description: 'Trigger scheduled crawls whose nextCrawlAt is due',
  },
  async run() {
    const now = new Date()
    const dueSchedules = await CrawlSchedule.find({
      enabled: true,
      nextCrawlAt: { $lte: now },
    }).lean()

    let triggered = 0
    let skipped = 0

    for (const schedule of dueSchedules) {
      // Skip if a crawl is already pending/running for this zone — checked first
      // so the bump of nextCrawlAt still happens (we don't want to re-evaluate
      // the same schedule every minute while a long crawl is running).
      const inFlight = await Crawl.findOne({
        siteId: schedule.siteId,
        zoneId: schedule.zoneId,
        status: { $in: ['pending', 'running'] },
      }).select('_id').lean()

      if (inFlight) {
        const nextAt = computeNextCrawlAt(schedule, now)
        await CrawlSchedule.updateOne(
          { _id: schedule._id, nextCrawlAt: schedule.nextCrawlAt },
          { $set: { nextCrawlAt: nextAt } },
        )
        skipped++
        continue
      }

      // Atomic claim — guarantees a single replica triggers the crawl even if
      // multiple scheduler ticks fire concurrently. The filter `nextCrawlAt =
      // schedule.nextCrawlAt` is the optimistic concurrency token.
      const nextAt = computeNextCrawlAt({ ...schedule, lastCrawledAt: now }, now)
      const claimed = await CrawlSchedule.findOneAndUpdate(
        { _id: schedule._id, nextCrawlAt: schedule.nextCrawlAt },
        { $set: { lastCrawledAt: now, nextCrawlAt: nextAt } },
      )

      if (!claimed) {
        skipped++
        continue
      }

      await triggerSiteCrawl(schedule.siteId, schedule.zoneId, 'scheduled')
      triggered++
    }

    if (triggered > 0 || skipped > 0) {
      log.info({ triggered, skipped, candidates: dueSchedules.length }, 'scheduled crawls evaluated')
    }
    return { result: { triggered, skipped } }
  },
})
