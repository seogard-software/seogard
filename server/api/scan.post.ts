import { Site, Zone, OrgMember } from '~~/server/database/models'
import { createSiteWithDefaultZone } from '~~/server/utils/site-create'
import { triggerSiteCrawl } from '~~/server/utils/crawl-trigger'
import { canOrgUseCrawls } from '~~/server/utils/entitlement'

// Onboarding « scan » (barre Analyser) : crée le site depuis l'URL saisie OU, si l'utilisateur
// l'a déjà dans une de SES orgas, renvoie le site existant (aucun re-crawl). À la création, on
// lance le 1er crawl tout de suite : le crawl re-découvre lui-même le sitemap (distributeCrawl →
// syncMonitoredPages), donc inutile d'attendre la discovery autonome. Le crawler n'est pas touché.
export default defineEventHandler(async (event) => {
  const log = useRequestLog(event, 'api.scan')
  const userId = requireAuth(event)

  const body = await readBody(event)
  if (!body?.url || typeof body.url !== 'string' || !isValidUrl(body.url)) {
    throw createError({ statusCode: 400, message: 'URL invalide' })
  }
  const url = normalizeUrl(body.url)
  log.info({ userId, url }, 'scan requested')

  // Dédup CROSS-ORGA : toutes les orgas de l'utilisateur, pas seulement l'active.
  const memberships = await OrgMember.find({ userId }).select('orgId').lean()
  const orgIds = memberships.map(m => m.orgId)
  const existing = orgIds.length
    ? await Site.findOne({ orgId: { $in: orgIds }, url }).select('_id').lean()
    : null

  if (existing) {
    const zone = await Zone.findOne({ siteId: existing._id, isDefault: true }).select('_id').lean()
    log.info({ userId, url, siteId: existing._id.toString() }, 'scan: existing site, redirect (no crawl)')
    return { existing: true, siteId: existing._id.toString(), defaultZoneId: zone?._id.toString() ?? null }
  }

  // Création dans l'orga active : exige owner (comme la création dashboard). Header requis ici.
  const orgId = getOrgIdFromHeader(event)
  await requireOrgRole(event, orgId, 'owner')
  log.info({ userId, url, orgId }, 'scan: creating new site')

  // Nom du site = le domaine (hostname) de l'URL normalisée.
  let name = url
  try { name = new URL(url).hostname }
  catch { /* URL déjà validée plus haut ; fallback = url brute */ }

  const site = await createSiteWithDefaultZone({ orgId, name, url })

  // 1er crawl immédiat (zone par défaut « toutes les pages »). Entitlement = l'orga (trial owner),
  // comme le CTA dashboard ; trial expiré → site créé sans crawl (l'utilisateur relancera après
  // avoir activé la facturation). Le crawl re-découvre le sitemap → pas de course avec la discovery.
  const zone = await Zone.findOne({ siteId: site._id, isDefault: true }).select('_id').lean()
  let crawlId: string | null = null
  if (zone && (await canOrgUseCrawls(orgId))) {
    const crawl = await triggerSiteCrawl(site._id, zone._id, 'manual')
    crawlId = crawl._id.toString()
  }

  log.info({ userId, url, siteId: site._id.toString(), crawlId }, 'scan: site created + crawl')
  return { created: true, siteId: site._id.toString(), defaultZoneId: zone?._id.toString() ?? null, crawlId }
})
