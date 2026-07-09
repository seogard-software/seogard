import { readBody, getRequestIP } from 'h3'
import { checkSitemapRateLimit } from '~~/server/utils/rate-limit'
import { Lead } from '~~/server/database/models'
import { isLocale, DEFAULT_LOCALE } from '~~/shared/utils/i18n'

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  checkSitemapRateLimit(ip)

  const body = await readBody(event)
  const { url, email, locale } = body as { url?: string; email?: string; locale?: string }

  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, message: 'url parameter required', data: { errorCode: 'URL_REQUIRED' } })
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw createError({ statusCode: 400, message: 'Invalid email', data: { errorCode: 'EMAIL_INVALID' } })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
  }
  catch {
    throw createError({ statusCode: 400, message: 'Invalid URL', data: { errorCode: 'INVALID_URL' } })
  }

  // Workers will pick up pending leads from MongoDB
  await Lead.create({
    url: parsedUrl.origin,
    email,
    // Langue de la page où le prospect a soumis → l'email d'estimation part dans SA langue.
    locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
    ip: ip !== 'unknown' ? ip : null,
    status: 'pending',
  })

  return { ok: true }
})
