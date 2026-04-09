import crypto from 'node:crypto'

const SID_COOKIE = 'sid'
const CONSENT_COOKIE = 'cookie-consent'
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60 // 1 an

export default defineEventHandler((event) => {
  // Only set sid if user has accepted cookies (RGPD)
  const consent = getCookie(event, CONSENT_COOKIE)
  if (consent !== 'accepted') return

  let sid = getCookie(event, SID_COOKIE)

  if (!sid) {
    sid = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    setCookie(event, SID_COOKIE, sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: MAX_AGE_SECONDS,
      path: '/',
    })
  }

  event.context.sessionId = sid
})
