import { Types } from 'mongoose'
import { MonitoredPage, Alert, Zone } from '~~/server/database/models'
import { createLogger } from '~~/server/utils/logger'
import { getTreeCache, setTreeCache } from '~~/server/utils/tree-cache'

const log = createLogger('web', 'api.zone-tree')

const SEVERITY_MAP: Record<number, 'critical' | 'warning' | 'info'> = {
  0: 'critical',
  1: 'warning',
  2: 'info',
}

function calcHealthScore(totalPages: number, regressions: number, recommendations: number, worstSeverity: 'critical' | 'warning' | 'info' | null): number {
  if (totalPages === 0) return 100
  let score = 100
  if (worstSeverity === 'critical') score -= 30
  else if (worstSeverity === 'warning') score -= 15
  score -= Math.min(40, (regressions / totalPages) * 40)
  score -= Math.min(10, (recommendations / totalPages) * 10)
  return Math.max(0, Math.round(score))
}

export default defineEventHandler(async (event) => {
  const start = Date.now()
  const id = requireValidId(event)
  const zoneId = getRouterParam(event, 'zoneId')
  if (!zoneId) {
    throw createError({ statusCode: 400, message: 'zoneId requis' })
  }

  const { site } = await requireZoneAccess(event, id, zoneId, 'viewer')

  const zone = await Zone.findOne({ _id: zoneId, siteId: id }).lean()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone introuvable' })
  }

  const query = getQuery(event)
  const drill = typeof query.drill === 'string' ? query.drill : '/'
  const limit = typeof query.limit === 'string' ? Math.max(1, Math.min(500, parseInt(query.limit, 10) || 50)) : 50

  // Cache key includes zoneId
  const cacheKey = `${id}:${zoneId}`
  const cached = getTreeCache(cacheKey, drill, limit)
  if (cached) {
    log.info({ siteId: id, zoneId, drill, limit, durationMs: Date.now() - start, cached: true }, 'zone tree response served')
    return cached
  }

  const siteObjectId = new Types.ObjectId(id)
  let hostname: string
  try {
    hostname = new URL(site.url).hostname
  } catch {
    hostname = site.url
  }

  const drillSegments = drill === '/' ? [] : drill.split('/').filter(Boolean)
  const drillDepth = drillSegments.length

  // Zone pattern filter on pathname (default zone ** matches everything)
  const zonePathnameFilter = zone.isDefault || (zone.patterns.length === 1 && zone.patterns[0] === '**')
    ? {}
    : { pathname: { $regex: zone._patternsRegex } }

  const pathnameMatch = drill === '/'
    ? zonePathnameFilter
    : {
        pathname: {
          $regex: `^${escapeRegex(drill)}(/|$)`,
          ...(zonePathnameFilter.pathname ? {} : {}),
        },
        ...zonePathnameFilter,
      }

  // If both drill and zone filters apply, combine with $and
  const pageMatch: Record<string, unknown> = { siteId: siteObjectId }
  if (drill !== '/' && zonePathnameFilter.pathname) {
    pageMatch.$and = [
      { pathname: { $regex: `^${escapeRegex(drill)}(/|$)` } },
      zonePathnameFilter,
    ]
  } else if (drill !== '/') {
    pageMatch.pathname = { $regex: `^${escapeRegex(drill)}(/|$)` }
  } else if (zonePathnameFilter.pathname) {
    Object.assign(pageMatch, zonePathnameFilter)
  }

  const alertMatch: Record<string, unknown> = { siteId: site._id, status: 'open' }

  // 1. Aggregate pages by next segment under drill path
  const [pageAgg, alertAgg] = await Promise.all([
    MonitoredPage.aggregate([
      { $match: pageMatch },
      {
        $addFields: {
          _pathname: {
            $ifNull: [
              '$pathname',
              {
                $let: {
                  vars: {
                    afterProto: {
                      $cond: {
                        if: { $regexMatch: { input: '$url', regex: /^https?:\/\// } },
                        then: { $arrayElemAt: [{ $split: ['$url', '://'] }, 1] },
                        else: '$url',
                      },
                    },
                  },
                  in: {
                    $let: {
                      vars: { hostEnd: { $indexOfCP: ['$$afterProto', '/'] } },
                      in: {
                        $cond: {
                          if: { $eq: ['$$hostEnd', -1] },
                          then: '/',
                          else: { $substrCP: ['$$afterProto', '$$hostEnd', { $subtract: [{ $strLenCP: '$$afterProto' }, '$$hostEnd'] }] },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          _segments: {
            $filter: {
              input: { $split: ['$_pathname', '/'] },
              as: 's',
              cond: { $ne: ['$$s', ''] },
            },
          },
        },
      },
      ...(drillSegments.length > 0
        ? [{
            $match: {
              $expr: {
                $and: [
                  { $gte: [{ $size: '$_segments' }, drillDepth] },
                  ...drillSegments.map((seg, i) => ({
                    $eq: [{ $arrayElemAt: ['$_segments', i] }, seg],
                  })),
                ],
              },
            },
          }]
        : []),
      {
        $addFields: {
          _childSegment: {
            $cond: {
              if: { $gt: [{ $size: '$_segments' }, drillDepth] },
              then: { $arrayElemAt: ['$_segments', drillDepth] },
              else: null,
            },
          },
          _childPath: {
            $cond: {
              if: { $gt: [{ $size: '$_segments' }, drillDepth] },
              then: {
                $concat: [
                  drill === '/' ? '' : drill,
                  '/',
                  { $arrayElemAt: ['$_segments', drillDepth] },
                ],
              },
              else: drill,
            },
          },
          _isDirectChild: { $eq: [{ $size: '$_segments' }, { $add: [drillDepth, 1] }] },
        },
      },
      {
        $group: {
          _id: '$_childSegment',
          path: { $first: '$_childPath' },
          totalPageCount: { $sum: 1 },
          leafUrl: { $first: { $cond: [{ $and: ['$_isDirectChild', { $ne: ['$_childSegment', null] }] }, '$url', null] } },
          leafStatusCode: { $first: { $cond: ['$_isDirectChild', '$lastStatusCode', null] } },
          leafMetaTitle: { $first: { $cond: ['$_isDirectChild', '$lastMeta.title', null] } },
          directChildCount: { $sum: { $cond: ['$_isDirectChild', 1, 0] } },
        },
      },
    ]),

    Alert.aggregate([
      { $match: alertMatch },
      {
        $addFields: {
          _alertPathname: {
            $let: {
              vars: {
                afterProto: {
                  $cond: {
                    if: { $regexMatch: { input: '$pageUrl', regex: /^https?:\/\// } },
                    then: { $arrayElemAt: [{ $split: ['$pageUrl', '://'] }, 1] },
                    else: '$pageUrl',
                  },
                },
              },
              in: {
                $let: {
                  vars: { hostEnd: { $indexOfCP: ['$$afterProto', '/'] } },
                  in: {
                    $cond: {
                      if: { $eq: ['$$hostEnd', -1] },
                      then: '/',
                      else: { $substrCP: ['$$afterProto', '$$hostEnd', { $subtract: [{ $strLenCP: '$$afterProto' }, '$$hostEnd'] }] },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          _alertSegments: {
            $filter: {
              input: { $split: ['$_alertPathname', '/'] },
              as: 's',
              cond: { $ne: ['$$s', ''] },
            },
          },
        },
      },
      // Filter alerts by zone patterns too
      ...(zone.isDefault ? [] : [{
        $match: {
          _alertPathname: { $regex: zone._patternsRegex },
        },
      }]),
      ...(drillSegments.length > 0
        ? [{
            $match: {
              $expr: {
                $and: [
                  { $gte: [{ $size: '$_alertSegments' }, drillDepth] },
                  ...drillSegments.map((seg, i) => ({
                    $eq: [{ $arrayElemAt: ['$_alertSegments', i] }, seg],
                  })),
                ],
              },
            },
          }]
        : []),
      {
        $addFields: {
          _alertChildSegment: {
            $cond: {
              if: { $gt: [{ $size: '$_alertSegments' }, drillDepth] },
              then: { $arrayElemAt: ['$_alertSegments', drillDepth] },
              else: null,
            },
          },
        },
      },
      {
        $group: {
          _id: '$_alertChildSegment',
          regressions: {
            $sum: { $cond: [{ $in: ['$category', ['state', 'event']] }, 1, 0] },
          },
          recommendations: {
            $sum: { $cond: [{ $eq: ['$category', 'recommendation'] }, 1, 0] },
          },
          worstSeverity: {
            $min: {
              $switch: {
                branches: [
                  { case: { $eq: ['$severity', 'critical'] }, then: 0 },
                  { case: { $eq: ['$severity', 'warning'] }, then: 1 },
                  { case: { $eq: ['$severity', 'info'] }, then: 2 },
                ],
                default: 3,
              },
            },
          },
        },
      },
    ]),
  ])

  const queryMs = Date.now() - start
  log.info({ siteId: id, zoneId, drill, pageGroups: pageAgg.length, alertGroups: alertAgg.length, queryMs }, 'zone MongoDB aggregation done')

  // Build alert map by child segment
  const alertMap = new Map<string | null, { regressions: number, recommendations: number, worstSeverity: 'critical' | 'warning' | 'info' | null }>()
  for (const row of alertAgg) {
    alertMap.set(row._id, {
      regressions: row.regressions,
      recommendations: row.recommendations,
      worstSeverity: SEVERITY_MAP[row.worstSeverity] ?? null,
    })
  }

  // Build response
  let rootTotalPages = 0
  let rootRegressions = 0
  let rootRecommendations = 0
  let rootWorstSeverity: 'critical' | 'warning' | 'info' | null = null

  const children: TreeNode[] = []
  let drillNodePageCount = 0

  for (const group of pageAgg) {
    const segment = group._id as string | null
    const alerts = alertMap.get(segment)
    const regressions = alerts?.regressions ?? 0
    const recommendations = alerts?.recommendations ?? 0
    const worstSeverity = alerts?.worstSeverity ?? null

    rootTotalPages += group.totalPageCount
    rootRegressions += regressions
    rootRecommendations += recommendations
    if (worstSeverity) {
      const sevOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 }
      if (!rootWorstSeverity || (sevOrder[worstSeverity] ?? 3) < (sevOrder[rootWorstSeverity] ?? 3)) {
        rootWorstSeverity = worstSeverity
      }
    }

    if (segment === null) {
      drillNodePageCount = group.totalPageCount
      // Add the drill-level page(s) as a leaf node (e.g. "/" when drilling "/")
      if (group.totalPageCount > 0) {
        const drillLabel = drill === '/' ? '/' : drill.split('/').pop()!
        children.push({
          id: drill,
          label: drillLabel,
          path: drill,
          isLeaf: true,
          pageCount: group.totalPageCount,
          totalPageCount: group.totalPageCount,
          regressionCount: regressions,
          recommendationCount: recommendations,
          worstSeverity,
          healthScore: calcHealthScore(group.totalPageCount, regressions, recommendations, worstSeverity),
          statusCode: group.leafStatusCode ?? null,
          metaTitle: group.leafMetaTitle ?? null,
          childrenLoaded: false,
          childrenIds: [],
        })
      }
      continue
    }

    const isLeaf = group.totalPageCount === 1 && group.directChildCount === 1
    children.push({
      id: group.path,
      label: segment,
      path: group.path,
      isLeaf,
      pageCount: group.directChildCount,
      totalPageCount: group.totalPageCount,
      regressionCount: regressions,
      recommendationCount: recommendations,
      worstSeverity,
      healthScore: calcHealthScore(group.totalPageCount, regressions, recommendations, worstSeverity),
      statusCode: isLeaf ? (group.leafStatusCode ?? null) : null,
      metaTitle: isLeaf ? (group.leafMetaTitle ?? null) : null,
      childrenLoaded: false,
      childrenIds: [],
    })
  }

  // Sort: regressions first, then recommendations, then page count
  children.sort((a, b) => {
    const hasRegA = a.regressionCount > 0
    const hasRegB = b.regressionCount > 0
    if (hasRegA !== hasRegB) return hasRegA ? -1 : 1
    if (hasRegA && hasRegB) {
      if (a.regressionCount !== b.regressionCount) return b.regressionCount - a.regressionCount
      return b.recommendationCount - a.recommendationCount
    }
    if (a.recommendationCount !== b.recommendationCount) return b.recommendationCount - a.recommendationCount
    return b.totalPageCount - a.totalPageCount
  })

  const totalChildrenCount = children.length
  const limitedChildren = children.slice(0, limit)
  const childrenIds = limitedChildren.map(c => c.path)

  const centerNode: TreeNode = {
    id: drill,
    label: drillSegments.length > 0 ? drillSegments[drillSegments.length - 1]! : hostname,
    path: drill,
    isLeaf: false,
    pageCount: drillNodePageCount,
    totalPageCount: rootTotalPages,
    regressionCount: rootRegressions,
    recommendationCount: rootRecommendations,
    worstSeverity: rootWorstSeverity,
    healthScore: calcHealthScore(rootTotalPages, rootRegressions, rootRecommendations, rootWorstSeverity),
    statusCode: null,
    metaTitle: null,
    childrenLoaded: true,
    childrenIds,
  }

  const result = {
    nodes: [centerNode, ...limitedChildren],
    totalPages: rootTotalPages,
    totalRegressions: rootRegressions,
    totalRecommendations: rootRecommendations,
    totalChildren: totalChildrenCount,
  }

  setTreeCache(cacheKey, drill, limit, result)

  const totalMs = Date.now() - start
  log.info({ siteId: id, zoneId, drill, limit, totalPages: rootTotalPages, childrenCount: totalChildrenCount, durationMs: totalMs, cached: false }, 'zone tree response served')

  return result
})

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
