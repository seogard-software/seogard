const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 min

interface RateLimitEntry {
  count: number
  firstAttemptAt: number
  blockedUntil: number
}

const attempts = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 10 min
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of attempts) {
    if (entry.blockedUntil && now > entry.blockedUntil) {
      attempts.delete(key)
    }
    else if (now - entry.firstAttemptAt > BLOCK_DURATION_MS) {
      attempts.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function checkLoginRateLimit(ip: string, email: string): void {
  const key = `${ip}:${email}`
  const entry = attempts.get(key)

  if (!entry) return

  if (entry.blockedUntil && Date.now() < entry.blockedUntil) {
    const minutesLeft = Math.ceil((entry.blockedUntil - Date.now()) / 60000)
    throw createError({
      statusCode: 429,
      message: `Trop de tentatives. Reessayez dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
    })
  }

  if (entry.blockedUntil && Date.now() >= entry.blockedUntil) {
    attempts.delete(key)
  }
}

export function recordFailedLogin(ip: string, email: string): void {
  const key = `${ip}:${email}`
  const entry = attempts.get(key) || { count: 0, firstAttemptAt: Date.now(), blockedUntil: 0 }

  entry.count++

  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_DURATION_MS
  }

  attempts.set(key, entry)
}

export function resetLoginAttempts(ip: string, email: string): void {
  attempts.delete(`${ip}:${email}`)
}

// ── Sitemap estimate rate limiting ──

const SITEMAP_MAX_REQUESTS = 5
const SITEMAP_WINDOW_MS = 15 * 60 * 1000 // 15 min

const sitemapAttempts = new Map<string, { count: number, windowStart: number }>()

// Cleanup expired sitemap entries every 10 min
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of sitemapAttempts) {
    if (now - entry.windowStart > SITEMAP_WINDOW_MS) {
      sitemapAttempts.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function checkSitemapRateLimit(ip: string): void {
  const now = Date.now()
  const entry = sitemapAttempts.get(ip)

  if (entry && now - entry.windowStart < SITEMAP_WINDOW_MS) {
    if (entry.count >= SITEMAP_MAX_REQUESTS) {
      const minutesLeft = Math.ceil((entry.windowStart + SITEMAP_WINDOW_MS - now) / 60000)
      throw createError({
        statusCode: 429,
        message: `Trop de requêtes. Réessayez dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
      })
    }
    entry.count++
  }
  else {
    sitemapAttempts.set(ip, { count: 1, windowStart: now })
  }
}
