import { Zone, OrgMember, Site } from '~~/server/database/models'
import { isValidPattern, normalizePattern } from '~~/shared/utils/zone'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const siteId = requireValidId(event)

  // Create zone requires: owner org OR admin of the default zone
  const defaultZone = await Zone.findOne({ siteId, isDefault: true }).lean()
  if (!defaultZone) {
    throw createError({ statusCode: 500, message: 'Zone par défaut introuvable' })
  }

  await requireZoneAccess(event, siteId, defaultZone._id.toString(), 'admin')

  const body = await readBody(event)

  if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'Le nom est requis' })
  }

  if (!Array.isArray(body.patterns) || body.patterns.length === 0) {
    throw createError({ statusCode: 400, message: 'Au moins un path est requis' })
  }

  for (const pattern of body.patterns) {
    if (typeof pattern !== 'string' || !isValidPattern(pattern)) {
      throw createError({ statusCode: 400, message: `Pattern invalide : "${pattern}". Doit commencer par / ou être **` })
    }
  }

  // Check name uniqueness within site
  const existing = await Zone.findOne({ siteId, name: body.name.trim() }).lean()
  if (existing) {
    throw createError({ statusCode: 409, message: 'Une zone avec ce nom existe déjà' })
  }

  const normalizedPatterns = body.patterns.map((p: string) => normalizePattern(p))

  const zone = await Zone.create({
    siteId,
    name: body.name.trim(),
    patterns: normalizedPatterns,
    isDefault: false,
    createdBy: userId,
  })

  // Auto-assign admin zone role to the creator (if not org owner — owners have implicit access)
  const site = await Site.findById(siteId).select('orgId').lean()
  if (site) {
    const member = await OrgMember.findOne({ orgId: (site as any).orgId, userId })
    if (member && member.role !== 'owner') {
      const hasZoneRole = member.zoneRoles?.some(
        (zr: any) => zr.zoneId.toString() === zone._id.toString(),
      )
      if (!hasZoneRole) {
        member.zoneRoles.push({ zoneId: zone._id, role: 'admin' })
        await member.save()
      }
    }
  }

  return zone
})
