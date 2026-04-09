import { Site, Zone } from '../../database/models'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const orgId = getOrgIdFromHeader(event)
  await requireOrgRole(event, orgId, 'owner')

  const reqLog = useRequestLog(event, 'api.sites')
  const body = await readBody(event)

  if (!body?.name || !body?.url) {
    throw createError({ statusCode: 400, message: 'Nom et URL requis' })
  }

  if (!isValidUrl(body.url)) {
    throw createError({ statusCode: 400, message: 'URL invalide' })
  }

  const normalizedUrl = normalizeUrl(body.url)

  const existing = await Site.findOne({ orgId, url: normalizedUrl }).lean()

  if (existing) {
    throw createError({ statusCode: 409, message: 'Ce site est déjà configuré' })
  }

  const site = await Site.create({
    orgId,
    name: body.name,
    url: normalizedUrl,
    discovering: 'pending',
  })

  if (!site) throw createError({ statusCode: 500, message: 'Database insert failed' })

  // Create default zone (all pages)
  await Zone.create({
    siteId: site._id,
    name: null,
    patterns: ['**'],
    isDefault: true,
    createdBy: null,
  })

  reqLog.info({ siteId: site._id, siteName: site.name, orgId }, 'site created')

  // Workers will pick up discovery via Site.discovering === 'pending' (polled from MongoDB)

  return site
})
