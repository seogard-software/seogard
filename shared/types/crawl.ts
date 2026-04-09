export type CrawlStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface CrawlResult {
  _id: string
  siteId: string
  zoneId: string | null
  status: CrawlStatus
  pagesScanned: number
  pagesFailed: number
  pagesBlocked: number
  pagesTotal: number
  alertsGenerated: number
  pagesSkipped: number
  sitemapBlocked: boolean
  startedAt: string
  completedAt: string | null
  error: string | null
}

export interface PageSnapshot {
  _id: string
  crawlId: string
  url: string
  statusCode: number
  csrRendered: boolean
  metaTitle: string | null
  metaDescription: string | null
  canonical: string | null
  hasNoindex: boolean
  ssrContentLength: number
  csrContentLength: number | null
  createdAt: string
}
