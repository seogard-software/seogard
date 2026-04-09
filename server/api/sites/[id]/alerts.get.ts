import { Alert } from '../../../database/models'

export default defineEventHandler(async (event) => {
  const id = requireValidId(event)
  const { site } = await requireSiteAccess(event, id, 'viewer')

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 100)
  const skip = Math.max(Number(query.skip) || 0, 0)
  const search = typeof query.q === 'string' ? query.q.trim() : ''
  const exactPath = typeof query.exactPath === 'string' ? query.exactPath.trim() : ''
  const severity = typeof query.severity === 'string' ? query.severity : ''
  const statusParam = typeof query.status === 'string' ? query.status : 'open'
  const summary = query.summary === 'true'
  const pathPrefix = typeof query.pathPrefix === 'string' ? query.pathPrefix : ''
  const category = typeof query.category === 'string' ? query.category : ''

  // Resolve status filter
  let statusFilter: string[]
  switch (statusParam) {
    case 'resolved': statusFilter = ['resolved']; break
    case 'all': statusFilter = ['open', 'resolved']; break
    default: statusFilter = ['open']
  }

  const filter: Record<string, unknown> = { siteId: site._id, status: { $in: statusFilter } }
  if (severity && ['critical', 'warning', 'info'].includes(severity)) {
    filter.severity = severity
  }
  if (pathPrefix) {
    const escaped = pathPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.pageUrl = { $regex: escaped }
  }
  if (exactPath) {
    const escaped = exactPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.pageUrl = { $regex: `^https?://[^/]+${escaped}/?$` }
  }
  else if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.pageUrl = { $regex: escaped, $options: 'i' }
  }
  if (category && ['state', 'event', 'recommendation'].includes(category)) {
    filter.category = category
  }
  const ruleId = typeof query.ruleId === 'string' ? query.ruleId : ''
  if (ruleId) {
    filter.ruleId = ruleId
  }

  // Summary mode: counts per severity for open alerts
  if (summary) {
    const activeFilter: Record<string, unknown> = { siteId: id, status: 'open' }
    const [critical, warning, info] = await Promise.all([
      Alert.countDocuments({ ...activeFilter, severity: 'critical' }),
      Alert.countDocuments({ ...activeFilter, severity: 'warning' }),
      Alert.countDocuments({ ...activeFilter, severity: 'info' }),
    ])
    return { critical, warning, info, total: critical + warning + info }
  }

  // Grouped mode: aggregate by ruleId with real counts
  const grouped = query.grouped === 'true'
  if (grouped) {
    const groups = await Alert.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { ruleId: '$ruleId', severity: '$severity', category: '$category' },
          count: { $sum: 1 },
          sampleMessage: { $first: '$message' },
          samplePageUrl: { $first: '$pageUrl' },
          hasOpen: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.severity': 1, count: -1 } },
    ])

    return {
      groups: groups.map(g => ({
        ruleId: g._id.ruleId,
        severity: g._id.severity,
        category: g._id.category,
        count: g.count,
        sampleMessage: g.sampleMessage,
        samplePageUrl: g.samplePageUrl,
      })),
    }
  }

  const [alerts, total] = await Promise.all([
    Alert.find(filter)
      .sort({ lastDetectedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Alert.countDocuments(filter),
  ])

  return { alerts, total, hasMore: skip + limit < total }
})
