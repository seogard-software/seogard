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
