import { Site } from '../../database/models'
import { createSiteWithDefaultZone } from '../../utils/site-create'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const orgId = getOrgIdFromHeader(event)
  await requireOrgRole(event, orgId, 'owner')

  const reqLog = useRequestLog(event, 'api.sites')
  const body = await readBody(event)

  if (!body?.name || !body?.url) {
    throw createError({ statusCode: 400, message: 'Name and URL required', data: { errorCode: 'NAME_AND_URL_REQUIRED' } })
  }

  if (!isValidUrl(body.url)) {
    throw createError({ statusCode: 400, message: 'Invalid URL', data: { errorCode: 'INVALID_URL' } })
  }

  const normalizedUrl = normalizeUrl(body.url)

  const existing = await Site.findOne({ orgId, url: normalizedUrl }).lean()

  if (existing) {
    throw createError({ statusCode: 409, message: 'Site already configured', data: { errorCode: 'SITE_ALREADY_EXISTS' } })
  }

  const site = await createSiteWithDefaultZone({ orgId, name: body.name, url: normalizedUrl })

  reqLog.info({ siteId: site._id, siteName: site.name, orgId }, 'site created')

  // Workers will pick up discovery via Site.discovering === 'pending' (polled from MongoDB)

  return site
})
