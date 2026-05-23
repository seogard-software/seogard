export type ZoneRole = 'owner' | 'admin' | 'member' | 'viewer'

export type CrawlScheduleFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface CrawlSchedule {
  _id?: string
  enabled: boolean
  frequency: CrawlScheduleFrequency
  dayOfWeek: number | null
  dayOfMonth: number | null
  lastDayOfMonth: boolean
  hour: number
  lastCrawledAt: string | null
  nextCrawlAt: string | null
}

export interface Zone {
  _id: string
  siteId: string
  name: string | null
  patterns: string[]
  isDefault: boolean
  _patternsRegex: string
  createdBy: string | null
  userRole: ZoneRole
  createdAt: string
  updatedAt: string
}

export interface CreateZonePayload {
  name: string
  patterns: string[]
}

export interface UpdateZonePayload {
  name?: string
  patterns?: string[]
}

export interface ZoneStats {
  zoneId: string
  pageCount: number
  alerts: {
    critical: number
    warning: number
    info: number
  }
}
