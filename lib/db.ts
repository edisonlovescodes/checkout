import { PrismaClient } from '@prisma/client'
import env from './env'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma =
  global.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log:
      env.LOG_LEVEL === 'debug'
        ? ['query', 'error', 'warn']
        : env.LOG_LEVEL === 'info'
        ? ['error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma
