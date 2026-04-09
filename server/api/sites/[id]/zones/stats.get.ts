import { Types } from 'mongoose'
import { Zone, MonitoredPage, Alert } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const siteId = requireValidId(event)
  await requireSiteAccess(event, siteId, 'viewer')

  const siteObjectId = new Types.ObjectId(siteId)
  const zones = await Zone.find({ siteId }).lean()

  if (zones.length === 0) return []

  // Single aggregation for page counts per zone
  const pageFacet: Record<string, any[]> = {}
  const alertFacet: Record<string, any[]> = {}

  for (const zone of zones) {
    const key = zone._id.toString()
    const regexSource = zone._patternsRegex || '^'

    pageFacet[key] = [
      { $match: { pathname: { $regex: regexSource } } },
      { $count: 'total' },
    ]

    alertFacet[key] = [
      { $match: { pageUrl: { $regex: regexSource }, status: 'open' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]
  }

  const [pageResults, alertResults] = await Promise.all([
    MonitoredPage.aggregate([
      { $match: { siteId: siteObjectId } },
      { $facet: pageFacet },
    ]),
    Alert.aggregate([
      { $match: { siteId: siteObjectId, status: 'open' } },
      { $facet: alertFacet },
    ]),
  ])

  const pageData = pageResults[0] || {}
  const alertData = alertResults[0] || {}

  return zones.map((zone) => {
    const key = zone._id.toString()
    const pageCount = pageData[key]?.[0]?.total ?? 0
    const alertGroups = alertData[key] ?? []

    return {
      zoneId: key,
      pageCount,
      alerts: {
        critical: alertGroups.find((a: any) => a._id === 'critical')?.count ?? 0,
        warning: alertGroups.find((a: any) => a._id === 'warning')?.count ?? 0,
        info: alertGroups.find((a: any) => a._id === 'info')?.count ?? 0,
      },
    }
  })
})
