import { Site, Zone } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const id = requireValidId(event)

  // Find default zone to check zone-level admin access
  const defaultZone = await Zone.findOne({ siteId: id, isDefault: true }).lean()
  if (!defaultZone) {
    throw createError({ statusCode: 404, message: 'Site not found', data: { errorCode: 'SITE_NOT_FOUND' } })
  }

  await requireZoneAccess(event, id, defaultZone._id.toString(), 'admin')

  const body = await readBody(event)

  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = body.name
  if (body.notifyEmail !== undefined) update.notifyEmail = body.notifyEmail

  const updated = await Site.findOneAndUpdate(
    { _id: id },
    update,
    { returnDocument: 'after' },
  ).lean()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Site not found', data: { errorCode: 'SITE_NOT_FOUND' } })
  }

  return updated
})
