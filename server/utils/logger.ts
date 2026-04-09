import type { H3Event } from 'h3'
import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'
const betterStackToken = process.env.BETTERSTACK_TOKEN

// Skip pino transports during prerender — worker threads keep the build process alive
const useTransport = !import.meta.prerender

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label }
    },
  },
  ...(useTransport && betterStackToken
    ? {
        transport: {
          target: '@logtail/pino',
          options: { sourceToken: betterStackToken },
        },
      }
    : useTransport && !isProduction
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
})

export function createLogger(service: string, module: string) {
  return logger.child({ service, module })
}

export function useRequestLog(event: H3Event, module: string) {
  return logger.child({
    service: 'web',
    module,
    sid: event.context.sessionId,
    userId: event.context.auth?.userId,
  })
}
