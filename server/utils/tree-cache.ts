import { createLogger } from './logger'

const log = createLogger('web', 'tree-cache')

interface CacheEntry {
  data: any
  expiry: number
}

const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = 30_000 // 30 seconds

function buildKey(siteId: string, drill: string, limit: number): string {
  return `${siteId}:${drill}:${limit}`
}

export function getTreeCache(siteId: string, drill: string, limit: number): any | null {
  const key = buildKey(siteId, drill, limit)
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  log.debug({ siteId, drill, limit }, 'tree cache hit')
  return entry.data
}

export function setTreeCache(siteId: string, drill: string, limit: number, data: any): void {
  const key = buildKey(siteId, drill, limit)
  cache.set(key, { data, expiry: Date.now() + DEFAULT_TTL_MS })
}

// Version d'invalidation cross-process du cache tree : on l'intègre à la clé de cache.
// Le crawler (autre process) écrit lastCrawlAt (fin de crawl) et pagesUpdatedAt (fin de
// discovery sitemap) dans Mongo ; le web les lit → la clé change → cache busté sans
// appel cross-process. On prend le max des deux : toute évolution des pages invalide.
export function treeCacheVersion(site: { lastCrawlAt?: Date | null, pagesUpdatedAt?: Date | null }): number {
  return Math.max(site.lastCrawlAt?.getTime() ?? 0, site.pagesUpdatedAt?.getTime() ?? 0)
}

export function invalidateTreeCache(siteId: string): void {
  let count = 0
  for (const key of cache.keys()) {
    if (key.startsWith(`${siteId}:`)) {
      cache.delete(key)
      count++
    }
  }
  if (count > 0) {
    log.info({ siteId, entriesCleared: count }, 'tree cache invalidated')
  }
}
