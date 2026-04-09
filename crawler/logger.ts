import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'
const betterStackToken = process.env.BETTERSTACK_TOKEN

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label }
    },
  },
  ...(isProduction
    ? betterStackToken
      ? {
          transport: {
            targets: [
              { target: '@logtail/pino', options: { sourceToken: betterStackToken }, level: 'info' },
              { target: 'pino/file', options: { destination: 1 }, level: 'info' },
            ],
          },
        }
      : {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
})

export function createLogger(module: string) {
  return logger.child({ service: 'crawler', module })
}
