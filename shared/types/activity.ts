export type ActivityEventType = 'crawl_completed' | 'alert_created' | 'alert_resolved'

export interface ActivityEvent {
  type: ActivityEventType
  siteId: string
  siteName: string
  message: string
  timestamp: string
  severity?: 'critical' | 'warning' | 'info'
  count?: number
}
