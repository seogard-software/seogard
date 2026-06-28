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
  sitemapInvalidHostname: boolean
  sitemapMissing: boolean
  lastCrawlPagesFailed: number
  // Pages monitorées sorties du sitemap au dernier crawl (signal de périmètre, pas une alerte).
  sitemapRemoved?: {
    count: number
    nonOkCount: number
    crawlId: string | null
    sampleUrls: string[]
  }
  sitemapRemovedAck?: {
    count: number
    crawlId: string | null
  }
  createdAt: string
  updatedAt: string
}

export interface CreateSitePayload {
  name: string
  url: string
}
