import { getCrawlReportSignedUrl } from '~~/server/utils/report-data'

// Téléchargement du rapport figé d'un crawl au format Markdown (fichier stocké sur R2/S3).
// Redirige vers une URL signée → le web ne manipule pas les octets. Viewer et +.
export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = requireValidId(event, 'zoneId')
  await requireZoneAccess(event, siteId, zoneId, 'viewer')

  const crawlId = getQuery(event).crawlId as string | undefined
  if (!crawlId) throw createError({ statusCode: 400, message: 'crawlId required', data: { errorCode: 'CRAWL_ID_REQUIRED' } })

  const url = await getCrawlReportSignedUrl(siteId, zoneId, crawlId, 'md')
  return sendRedirect(event, url, 302)
})
