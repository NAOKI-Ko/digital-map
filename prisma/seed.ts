import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import { PrismaClient } from './generated/client'

const connectionString =
  process.env.DATABASE_URL
  ?? 'postgresql://digital_map:digital_map@localhost:5432/digital_map?schema=public'

const tenantName = process.env.SEED_TENANT_NAME ?? 'デジタルマップ運営'
const tenantSlug = process.env.SEED_TENANT_SLUG ?? 'default'
const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase()
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-before-production'

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  if (adminPassword.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD は12文字以上で指定してください。')
  }

  const passwordHash = await hash(adminPassword, 12)
  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: tenantName },
    create: {
      name: tenantName,
      slug: tenantSlug,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      tenantId: tenant.id,
      passwordHash,
      role: 'admin',
    },
    create: {
      tenantId: tenant.id,
      email: adminEmail,
      passwordHash,
      role: 'admin',
    },
  })

  console.info(`管理者を作成しました: ${admin.email} (${tenant.name})`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
