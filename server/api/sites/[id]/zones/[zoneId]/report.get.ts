import { loadZoneCrawlHistory } from '~~/server/utils/report-data'

// Données de la page : historique des crawls (snapshots) de la zone. Chaque crawl → downloads
// .md/.pdf via ?crawlId (rendus depuis le snapshot stocké). Viewer et plus.
export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  const zoneId = requireValidId(event, 'zoneId')
  await requireZoneAccess(event, siteId, zoneId, 'viewer')

  return await loadZoneCrawlHistory(siteId, zoneId)
})
