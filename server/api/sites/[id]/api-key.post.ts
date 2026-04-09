import { randomUUID } from 'node:crypto'
import { Site } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const id = requireValidId(event)
  await requireSiteOrAnyZoneAccess(event, id, 'admin')

  const newKey = randomUUID()
  const site = await Site.findOneAndUpdate(
    { _id: id },
    { apiKey: newKey },
    { new: true, projection: { apiKey: 1 } },
  )

  if (!site) {
    throw createError({ statusCode: 404, message: 'Site non trouvé' })
  }

  return { apiKey: site.apiKey }
})
