import { createLogger } from '../utils/logger'

const logger = createLogger('web', 'request')

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) return

  event.context.log = logger.child({
    sid: event.context.sessionId,
    userId: event.context.auth?.userId,
    method: event.method,
    path,
  })
})
