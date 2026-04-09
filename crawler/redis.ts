import Redis from 'ioredis'
import { createLogger } from './logger'

const log = createLogger('redis')

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

let client: Redis | null = null

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    })

    client.on('connect', () => log.info({ url: REDIS_URL }, 'redis connected'))
    client.on('error', (err) => log.error({ errorCode: 'REDIS_ERROR', error: err.message }, 'redis error'))
  }

  return client
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit()
    client = null
  }
}

// --- Queue helpers ---

const PAGES_QUEUE = (crawlId: string) => `crawl:${crawlId}:pages`
const CRAWL_META = (crawlId: string) => `crawl:${crawlId}:meta`
const CRAWL_PROGRESS = (crawlId: string) => `crawl:${crawlId}:progress`
const CRAWL_DEQUEUED = (crawlId: string) => `crawl:${crawlId}:dequeued`
const CRAWL_BLOCKED = (crawlId: string) => `crawl:${crawlId}:blocked`
const CRAWL_FAILED = (crawlId: string) => `crawl:${crawlId}:failed`
const CRAWL_ALERTS = (crawlId: string) => `crawl:${crawlId}:alerts`
const ACTIVE_CRAWLS = 'crawl:active-set'
const DISTRIBUTING_LOCK = 'crawl:distributing'

export async function pushPages(crawlId: string, siteId: string, urls: string[]): Promise<void> {
  const redis = getRedis()
  const pipeline = redis.pipeline()

  // Store crawl metadata
  pipeline.hset(CRAWL_META(crawlId), { siteId, totalPages: urls.length.toString() })
  pipeline.expire(CRAWL_META(crawlId), 86400) // 24h TTL

  // Initialize progress counters
  pipeline.set(CRAWL_PROGRESS(crawlId), '0')
  pipeline.expire(CRAWL_PROGRESS(crawlId), 86400)
  pipeline.set(CRAWL_DEQUEUED(crawlId), '0')
  pipeline.expire(CRAWL_DEQUEUED(crawlId), 86400)
  pipeline.set(CRAWL_BLOCKED(crawlId), '0')
  pipeline.expire(CRAWL_BLOCKED(crawlId), 86400)
  pipeline.set(CRAWL_FAILED(crawlId), '0')
  pipeline.expire(CRAWL_FAILED(crawlId), 86400)
  pipeline.set(CRAWL_ALERTS(crawlId), '0')
  pipeline.expire(CRAWL_ALERTS(crawlId), 86400)

  // Push all URLs in batches of 1000 to avoid huge commands
  for (let i = 0; i < urls.length; i += 1000) {
    const batch = urls.slice(i, i + 1000)
    pipeline.lpush(PAGES_QUEUE(crawlId), ...batch)
  }

  pipeline.expire(PAGES_QUEUE(crawlId), 86400)

  await pipeline.exec()

  log.info({ crawlId, totalPages: urls.length }, 'pages pushed to Redis queue')
}

export async function popPage(crawlId: string): Promise<string | null> {
  const redis = getRedis()
  return redis.rpop(PAGES_QUEUE(crawlId))
}

// Pop N pages d'un coup depuis la queue Redis (1 seule commande au lieu de N)
// Utilise RPOP avec count natif (Redis 6.2+)
export async function popPageBatch(crawlId: string, count: number): Promise<string[]> {
  const redis = getRedis()
  const urls = await redis.rpop(PAGES_QUEUE(crawlId), count) as string[] | null
  if (!urls || urls.length === 0) return []

  // Compteur de pages consommees (utilisé pour le suivi de progression)
  await redis.incrby(CRAWL_DEQUEUED(crawlId), urls.length)

  return urls
}

export async function incrementProgress(crawlId: string, count: number = 1): Promise<number> {
  const redis = getRedis()
  return redis.incrby(CRAWL_PROGRESS(crawlId), count)
}

export async function incrementBlocked(crawlId: string, count: number = 1): Promise<number> {
  const redis = getRedis()
  return redis.incrby(CRAWL_BLOCKED(crawlId), count)
}

export async function incrementFailed(crawlId: string, count: number = 1): Promise<number> {
  const redis = getRedis()
  return redis.incrby(CRAWL_FAILED(crawlId), count)
}

export async function incrementAlerts(crawlId: string, count: number = 1): Promise<number> {
  const redis = getRedis()
  return redis.incrby(CRAWL_ALERTS(crawlId), count)
}

export async function getProgress(crawlId: string): Promise<{ scanned: number, dequeued: number, total: number, blocked: number, failed: number, alerts: number }> {
  const redis = getRedis()
  const [scanned, dequeued, blocked, failed, alerts, meta] = await Promise.all([
    redis.get(CRAWL_PROGRESS(crawlId)),
    redis.get(CRAWL_DEQUEUED(crawlId)),
    redis.get(CRAWL_BLOCKED(crawlId)),
    redis.get(CRAWL_FAILED(crawlId)),
    redis.get(CRAWL_ALERTS(crawlId)),
    redis.hgetall(CRAWL_META(crawlId)),
  ])

  return {
    scanned: Number(scanned) || 0,
    dequeued: Number(dequeued) || 0,
    total: Number(meta.totalPages) || 0,
    blocked: Number(blocked) || 0,
    failed: Number(failed) || 0,
    alerts: Number(alerts) || 0,
  }
}

/**
 * Add a crawl to the active set. Multiple crawls can be active simultaneously.
 */
export async function addActiveCrawl(crawlId: string): Promise<void> {
  const redis = getRedis()
  await redis.sadd(ACTIVE_CRAWLS, crawlId)
}

/**
 * Get count of active crawls.
 */
export async function getActiveCrawlCount(): Promise<number> {
  const redis = getRedis()
  return redis.scard(ACTIVE_CRAWLS)
}

/**
 * Remove a crawl from the active set (completed or failed).
 */
export async function removeActiveCrawl(crawlId: string): Promise<void> {
  const redis = getRedis()
  await redis.srem(ACTIVE_CRAWLS, crawlId)
}

/**
 * Get all active crawl IDs.
 */
export async function getActiveCrawls(): Promise<string[]> {
  const redis = getRedis()
  return redis.smembers(ACTIVE_CRAWLS)
}

/**
 * Atomically claim the distribution lock. Only one worker can distribute pages at a time.
 * Lock expires after 5 minutes (safety net if worker crashes during distribution).
 */
export async function claimDistributionLock(crawlId: string): Promise<boolean> {
  const redis = getRedis()
  const result = await redis.set(DISTRIBUTING_LOCK, crawlId, 'EX', 300, 'NX')
  return result === 'OK'
}

export async function clearDistributionLock(crawlId: string): Promise<void> {
  const redis = getRedis()
  // Only delete if this worker's crawlId holds the lock (atomic via Lua)
  await redis.eval(
    `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
    1, DISTRIBUTING_LOCK, crawlId,
  )
}

export async function getRemainingPages(crawlId: string): Promise<number> {
  const redis = getRedis()
  return redis.llen(PAGES_QUEUE(crawlId))
}

