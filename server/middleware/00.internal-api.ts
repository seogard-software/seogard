import { timingSafeEqual } from 'node:crypto'

// API interne PRIVÉE (/api/internal/*) — consommée uniquement par le CRM de prospection.
// Protégée par une clé partagée (env INTERNAL_API_KEY), comparée en temps constant.
// Code visible (repo BSL) mais inutilisable sans la clé. Jamais de clé en dur.
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/internal/')) return

  const expected = process.env.INTERNAL_API_KEY || ''
  if (!expected) {
    throw createError({ statusCode: 503, message: 'API interne non configurée (INTERNAL_API_KEY)' })
  }

  const provided = getHeader(event, 'x-internal-key') || ''
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw createError({ statusCode: 401, message: 'Clé interne invalide' })
  }
})
