import { User } from '../database/models'

// Whitelist — seules ces routes sont accessibles en self-hosted sans auth
const ALLOWED_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/invite/',
  '/dashboard/',
  '/docs',
  '/bot',
  '/api/',
  '/_nuxt/',
  '/__nuxt',
]

// Cache user count pour eviter un count MongoDB a chaque requete
let cachedUserCount: number | null = null
let cacheExpiry = 0

async function getUserCount(): Promise<number> {
  if (cachedUserCount !== null && Date.now() < cacheExpiry) return cachedUserCount
  cachedUserCount = await User.countDocuments()
  cacheExpiry = Date.now() + 60_000 // cache 60s
  return cachedUserCount
}

export default defineEventHandler(async (event) => {
  if (String(process.env.NUXT_PUBLIC_SELF_HOSTED) !== 'true') return

  const path = getRequestURL(event).pathname

  // Assets et fichiers statiques — toujours accessibles
  if (path.includes('.') && !path.endsWith('.html')) return

  // Routes whitelistees
  if (ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix))) {
    // Redirect /login → /register si 0 users (premier lancement)
    if (path === '/login') {
      const count = await getUserCount()
      if (count === 0) {
        return sendRedirect(event, '/register', 302)
      }
    }
    return
  }

  // Tout le reste → redirect /login
  return sendRedirect(event, '/login', 302)
})
