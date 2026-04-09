import { readBody, getRequestIP } from 'h3'
import { checkSitemapRateLimit } from '~~/server/utils/rate-limit'
import { Lead } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  checkSitemapRateLimit(ip)

  const body = await readBody(event)
  const { url, email } = body as { url?: string; email?: string }

  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, message: 'Le paramètre url est requis.' })
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw createError({ statusCode: 400, message: 'Email invalide.' })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
  }
  catch {
    throw createError({ statusCode: 400, message: 'URL invalide.' })
  }

  // Workers will pick up pending leads from MongoDB
  await Lead.create({
    url: parsedUrl.origin,
    email,
    ip: ip !== 'unknown' ? ip : null,
    status: 'pending',
  })

  return { ok: true }
})
