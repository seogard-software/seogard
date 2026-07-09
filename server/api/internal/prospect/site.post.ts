import type { Types } from 'mongoose'
import { Site, Zone } from '~~/server/database/models'
import { createSiteWithDefaultZone } from '~~/server/utils/site-create'
import { triggerSiteCrawl } from '~~/server/utils/crawl-trigger'

// Crée (ou retrouve) le site d'un prospect dans l'orga « audit prospect » et déclenche
// un crawl. Réutilise les helpers produit `createSiteWithDefaultZone` + `triggerSiteCrawl`
// (zéro duplication ; crawl identique au clic manuel du dashboard).
// Consommé par le CRM via l'API interne (clé). Retourne un deep-link vers le dashboard prod.
export default defineEventHandler(async (event) => {
  const orgId = process.env.INTERNAL_PROSPECT_ORG_ID
  if (!orgId) {
    throw createError({ statusCode: 503, message: 'INTERNAL_PROSPECT_ORG_ID not configured', data: { errorCode: 'PROSPECT_ORG_NOT_CONFIGURED' } })
  }

  const body = await readBody(event)
  if (!body?.url || !isValidUrl(body.url)) {
    throw createError({ statusCode: 400, message: 'Valid URL required', data: { errorCode: 'INVALID_URL' } })
  }

  const url = normalizeUrl(body.url)
  const name = (typeof body.name === 'string' && body.name.trim()) || new URL(url).hostname

  const existing = await Site.findOne({ orgId, url }).select('_id').lean<{ _id: Types.ObjectId }>()
  let siteId: Types.ObjectId
  if (existing) {
    siteId = existing._id
  }
  else {
    const created = await createSiteWithDefaultZone({ orgId, name, url })
    siteId = created._id as Types.ObjectId
  }

  // Déclenche le crawl sur la zone par défaut (« Toutes les pages » = site entier) — un site
  // prospect n'a que celle-là.
  const defaultZone = await Zone.findOne({ siteId, isDefault: true }).select('_id').lean()
  if (!defaultZone) {
    throw createError({ statusCode: 500, message: 'Default zone not found', data: { errorCode: 'DEFAULT_ZONE_NOT_FOUND' } })
  }
  const crawl = await triggerSiteCrawl(siteId, defaultZone._id)

  const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'
  return {
    siteId: String(siteId),
    crawlId: String(crawl._id),
    dashboardUrl: `${appUrl}/dashboard/sites/${siteId}`,
  }
})
