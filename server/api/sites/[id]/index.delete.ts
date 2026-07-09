import { Site } from '../../../database/models'
import { deleteSitesCascade } from '../../../database/cascade'

export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.sites')
  const id = requireValidId(event)
  await requireSiteAccess(event, id, 'admin')

  const site = await Site.findOneAndDelete({ _id: id }).lean()

  if (!site) {
    throw createError({ statusCode: 404, message: 'Site not found', data: { errorCode: 'SITE_NOT_FOUND' } })
  }

  // Cascade unique (registre + tripwire) : server/database/cascade.ts
  await deleteSitesCascade([id])

  log.info({ siteId: id, siteName: site.name }, 'site deleted')

  return { success: true }
})
