import { Site, Zone } from '../database/models'

// Création canonique d'un site + sa zone par défaut (« toutes les pages », patterns ['**']).
// SOURCE UNIQUE : réutilisée par la création dashboard (sites/index.post) ET l'API interne
// prospect. L'appelant valide/normalise l'URL et gère le dédoublonnage (le comportement
// diffère selon le contexte : 409 côté dashboard, réutilisation côté prospect).
export async function createSiteWithDefaultZone(input: { orgId: string, name: string, url: string }) {
  const site = await Site.create({
    orgId: input.orgId,
    name: input.name,
    url: input.url,
    discovering: 'pending',
  })
  if (!site) throw createError({ statusCode: 500, message: 'Database insert failed', data: { errorCode: 'INTERNAL_ERROR' } })

  await Zone.create({ siteId: site._id, name: null, patterns: ['**'], isDefault: true, createdBy: null })

  return site
}
