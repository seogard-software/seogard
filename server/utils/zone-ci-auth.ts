import type { H3Event } from 'h3'
import { requireZoneAccess } from './org-auth'
import { Site } from '../database/models'

type ZoneCrawlRole = 'viewer' | 'member' | 'admin' | 'owner'

// Auth des endpoints webhook PAR ZONE (crawl + crawl-status) :
// - clé API du site (`x-api-key`) → usage CI headless (pas de session) ;
// - sinon session (dashboard) via requireZoneAccess.
// La clé API du site = confiance niveau site (comme l'ancien /api/webhooks/deploy).
export async function requireZoneCrawlAccess(
  event: H3Event,
  siteId: string,
  zoneId: string,
  minRole: ZoneCrawlRole,
): Promise<{ site: any, viaApiKey: boolean }> {
  const apiKey = getHeader(event, 'x-api-key')
  if (apiKey) {
    const site = await Site.findOne({ _id: siteId, apiKey }).lean()
    if (!site) {
      throw createError({ statusCode: 401, message: 'Invalid API key', data: { errorCode: 'API_KEY_INVALID' } })
    }
    return { site, viaApiKey: true }
  }
  const { site } = await requireZoneAccess(event, siteId, zoneId, minRole)
  return { site, viaApiKey: false }
}
