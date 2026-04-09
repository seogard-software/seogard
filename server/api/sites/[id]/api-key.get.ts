export default defineEventHandler(async (event) => {
  const id = requireValidId(event)
  const { site } = await requireSiteOrAnyZoneAccess(event, id, 'admin')

  return { apiKey: (site as any).apiKey }
})
