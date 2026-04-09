export interface MetaData {
  title: string | null
  description: string | null
  canonical: string | null
  robots: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
}

export interface MonitoredPage {
  _id: string
  siteId: string
  url: string
  lastStatusCode: number
  lastMeta: MetaData
  lastRenderedAt: string | null
  lastCheckedAt: string
  createdAt: string
}

export interface PageDiff {
  pageUrl: string
  field: string
  previousValue: string | null
  currentValue: string | null
  detectedAt: string
}
