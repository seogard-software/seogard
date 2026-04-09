import { connectDB } from '../utils/db'
import { createLogger } from '../utils/logger'

const log = createLogger('web', 'db')

export default defineNitroPlugin(async () => {
  if (import.meta.prerender) return

  try {
    await connectDB()
    log.info('MongoDB connected')
  } catch (error) {
    log.fatal({ errorCode: 'DB_CONNECTION_FAILED', error: (error as Error).message }, 'MongoDB connection failed')
    throw error
  }
})
