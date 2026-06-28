import { Site, Zone } from '../../../database/models'

// Acquittement du bandeau « pages disparues du sitemap » (« C'est normal, masquer »). On mémorise
// le count acquitté : le bandeau ne réapparaît que si le count repart au-dessus (nouvelle variation
// de périmètre). Droit admin (comme la config notifications). Aucune alerte n'est touchée.
export default defineEventHandler(async (event) => {
  const id = requireValidId(event)

  const defaultZone = await Zone.findOne({ siteId: id, isDefault: true }).lean()
  if (!defaultZone) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  await requireZoneAccess(event, id, defaultZone._id.toString(), 'admin')

  const site = await Site.findById(id).select('sitemapRemoved').lean()
  if (!site) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  await Site.updateOne({ _id: id }, {
    sitemapRemovedAck: {
      count: site.sitemapRemoved?.count ?? 0,
      crawlId: site.sitemapRemoved?.crawlId ?? null,
    },
  })

  return { ok: true }
})
