import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/client'

const connectionString =
  process.env.DATABASE_URL
  ?? 'postgresql://digital_map:digital_map@localhost:5432/digital_map?schema=public'

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

type PrismaClientInstance = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
