import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/client'
import { hash } from 'bcryptjs'
import { defaultSpotFieldDefinitions } from '../../shared/constants/spot-fields'

const url = process.env.DATABASE_URL
if (!url || new URL(url).pathname !== '/digital_map_test_wu65') throw new Error('Only the disposable digital_map_test_wu65 database is allowed')
if (!process.env.WU65_QA_PASSWORD) throw new Error('WU65_QA_PASSWORD is required')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
try {
  const user = await prisma.user.upsert({ where: { email: 'wu65-qa@example.invalid' }, update: {}, create: { email: 'wu65-qa@example.invalid', passwordHash: await hash(process.env.WU65_QA_PASSWORD, 10), emailVerifiedAt: new Date() } })
  for (const [suffix, name] of [['facility', 'WU65 施設 QA'], ['retail', 'WU65 商店街 QA']]) {
    const tenant = await prisma.tenant.upsert({ where: { slug: `wu65-${suffix}` }, update: {}, create: { slug: `wu65-${suffix}`, name: name!, members: { create: { userId: user.id, role: 'OWNER' } } } })
    const map = await prisma.map.upsert({ where: { slug: `wu65-${suffix}` }, update: {}, create: { slug: `wu65-${suffix}`, name: name!, tenantId: tenant.id, spotFieldDefinitions: { create: defaultSpotFieldDefinitions.map(field => ({ ...field })) } } })
    const floorCount = suffix === 'facility' ? 5 : 1
    for (let index = 0; index < floorCount; index++) {
      await prisma.mapFloor.upsert({ where: { id: `wu65-${suffix}-floor-${index}` }, update: {}, create: { id: `wu65-${suffix}-floor-${index}`, mapId: map.id, name: `${index + 1}F`, order: index, illustrationUrl: '/__qa__/public-map-decorations/fixture-ground.png', imageWidth: 1024, imageHeight: 768 } })
    }
    for (const [index, categoryName] of ['展示', '飲食', '休憩', '案内', '買い物', 'サービス'].entries()) {
      await prisma.category.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: categoryName } }, update: {}, create: { tenantId: tenant.id, mapId: map.id, name: categoryName, order: index } })
    }
    console.log(JSON.stringify({ fixture: suffix, mapId: map.id, floors: floorCount }))
  }
} finally { await prisma.$disconnect() }
