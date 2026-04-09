import { Zone } from '~~/server/database/models'
import { isValidPattern, normalizePattern, patternsToRegexSource } from '~~/shared/utils/zone'
import { invalidateTreeCache } from '~~/server/utils/tree-cache'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId requis' })
  }

  await requireZoneAccess(event, siteId, zoneId, 'admin')

  const zone = await Zone.findOne({ _id: zoneId, siteId })
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone introuvable' })
  }

  if (zone.isDefault) {
    throw createError({ statusCode: 403, message: 'La zone par défaut ne peut pas être modifiée' })
  }

  const body = await readBody(event)
  const update: Record<string, any> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      throw createError({ statusCode: 400, message: 'Le nom ne peut pas être vide' })
    }
    // Check name uniqueness
    const dup = await Zone.findOne({ siteId, name: body.name.trim(), _id: { $ne: zoneId } }).lean()
    if (dup) {
      throw createError({ statusCode: 409, message: 'Une zone avec ce nom existe déjà' })
    }
    update.name = body.name.trim()
  }

  if (body.patterns !== undefined) {
    if (!Array.isArray(body.patterns) || body.patterns.length === 0) {
      throw createError({ statusCode: 400, message: 'Au moins un path est requis' })
    }
    for (const pattern of body.patterns) {
      if (typeof pattern !== 'string' || !isValidPattern(pattern)) {
        throw createError({ statusCode: 400, message: `Pattern invalide : "${pattern}"` })
      }
    }
    update.patterns = body.patterns.map((p: string) => normalizePattern(p))
    update._patternsRegex = patternsToRegexSource(update.patterns)
  }

  if (Object.keys(update).length === 0) {
    return zone
  }

  const updated = await Zone.findByIdAndUpdate(zoneId, { $set: update }, { new: true }).lean()

  // Invalidate tree cache for this site (zone patterns changed)
  if (update.patterns) {
    invalidateTreeCache(siteId)
    invalidateTreeCache(`${siteId}:${zoneId}`)
  }

  return updated
})
