export type SiteStatus = 'active' | 'paused' | 'error'
export type CiStrictness = 'strict' | 'standard' | 'relaxed'

export interface Site {
  _id: string
  orgId: string
  name: string
  url: string
  status: SiteStatus
  pagesCount: number
  lastCrawlAt: string | null
  crawlStatus: 'completed' | 'running' | null
  discovering: 'idle' | 'pending' | 'running'
  sitemapBlocked: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSitePayload {
  name: string
  url: string
}
