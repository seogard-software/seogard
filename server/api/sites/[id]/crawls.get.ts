import { Crawl } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const id = requireValidId(event)
  await requireSiteAccess(event, id, 'viewer')

  return Crawl.find({ siteId: id }).sort({ createdAt: -1 }).limit(50).lean()
})
