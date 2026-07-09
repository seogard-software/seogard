import { Zone } from '~~/server/database/models'
import { isValidPattern, normalizePattern, patternsToRegexSource } from '~~/shared/utils/zone'
import { invalidateTreeCache } from '~~/server/utils/tree-cache'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId required', data: { errorCode: 'ZONE_ID_REQUIRED' } })
  }

  await requireZoneAccess(event, siteId, zoneId, 'admin')

  const zone = await Zone.findOne({ _id: zoneId, siteId })
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone not found', data: { errorCode: 'ZONE_NOT_FOUND' } })
  }

  const body = await readBody(event)
  const update: Record<string, any> = {}

  // La zone par défaut est figée sur nom/patterns ; seule sa strictness CI reste réglable.
  if (zone.isDefault && (body.name !== undefined || body.patterns !== undefined)) {
    throw createError({ statusCode: 403, message: 'Default zone cannot be modified (name/patterns)', data: { errorCode: 'DEFAULT_ZONE_IMMUTABLE' } })
  }

  if (body.ciStrictness !== undefined) {
    if (!['strict', 'standard', 'relaxed'].includes(body.ciStrictness)) {
      throw createError({ statusCode: 400, message: 'Invalid strictness', data: { errorCode: 'STRICTNESS_INVALID' } })
    }
    update.ciStrictness = body.ciStrictness
  }

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      throw createError({ statusCode: 400, message: 'Name cannot be empty', data: { errorCode: 'NAME_REQUIRED' } })
    }
    // Check name uniqueness
    const dup = await Zone.findOne({ siteId, name: body.name.trim(), _id: { $ne: zoneId } }).lean()
    if (dup) {
      throw createError({ statusCode: 409, message: 'A zone with this name already exists', data: { errorCode: 'ZONE_NAME_TAKEN' } })
    }
    update.name = body.name.trim()
  }

  if (body.patterns !== undefined) {
    if (!Array.isArray(body.patterns) || body.patterns.length === 0) {
      throw createError({ statusCode: 400, message: 'At least one path is required', data: { errorCode: 'PATTERNS_REQUIRED' } })
    }
    for (const pattern of body.patterns) {
      if (typeof pattern !== 'string' || !isValidPattern(pattern)) {
        throw createError({ statusCode: 400, message: `Invalid pattern: "${pattern}"`, data: { errorCode: 'PATTERN_INVALID', pattern } })
      }
    }
    update.patterns = body.patterns.map((p: string) => normalizePattern(p))
    update._patternsRegex = patternsToRegexSource(update.patterns)
  }

  if (Object.keys(update).length === 0) {
    return zone
  }

  const updated = await Zone.findByIdAndUpdate(zoneId, { $set: update }, { returnDocument: 'after' }).lean()

  // Invalidate tree cache for this site (zone patterns changed)
  if (update.patterns) {
    invalidateTreeCache(siteId)
    invalidateTreeCache(`${siteId}:${zoneId}`)
  }

  return updated
})
