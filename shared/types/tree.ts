export interface TreeNode {
  id: string
  label: string
  path: string
  isLeaf: boolean
  pageCount: number
  totalPageCount: number
  regressionCount: number
  recommendationCount: number
  worstSeverity: 'critical' | 'warning' | 'info' | null
  healthScore: number
  statusCode: number | null
  metaTitle: string | null
  childrenLoaded: boolean
  childrenIds: string[]
}

export interface TreeResponse {
  nodes: TreeNode[]
  totalPages: number
  totalRegressions: number
  totalRecommendations: number
  totalChildren: number
}