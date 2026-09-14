import 'dotenv/config'
import { hash } from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
const password = process.env.WU40_UAT_PASSWORD
if (!password || password.length < 12) throw new Error('WU40_UAT_PASSWORD must be at least 12 characters')

const users = {
  ownerA: ['wu40-owner-a', 'codex-owner-a@qa.invalid', 'WU40 Owner A'],
  editorA: ['wu40-editor-a', 'codex-editor-a@qa.invalid', 'WU40 Map Editor A'],
  spotA: ['wu40-spot-a', 'codex-spot-a@qa.invalid', 'WU40 Spot Editor A'],
  spotA2: ['wu40-spot-a2', 'codex-spot2-a@qa.invalid', 'WU40 Spot Editor A2'],
  inviteeA: ['wu40-invitee-a', 'codex-invitee-a@qa.invalid', 'WU40 Invitee A'],
  ownerB: ['wu40-owner-b', 'codex-owner-b@qa.invalid', 'WU40 Owner B'],
} as const

async function main() {
  const passwordHash = await hash(password, 10)
  for (const [id, email, displayName] of Object.values(users)) {
    await prisma.user.upsert({
      where: { email },
      update: { displayName, passwordHash, isActive: true, emailVerifiedAt: new Date() },
      create: { id, email, displayName, passwordHash, isActive: true, emailVerifiedAt: new Date() },
    })
  }

  const mapA1 = await prisma.map.findUniqueOrThrow({ where: { slug: 'team-demo-arimatsu' }, include: { tenant: true } })
  const mapA2 = await prisma.map.findFirstOrThrow({ where: { tenantId: mapA1.tenantId, id: { not: mapA1.id } }, orderBy: { createdAt: 'asc' } })
  await prisma.tenant.update({ where: { id: mapA1.tenantId }, data: { name: 'WU40 Tenant A' } })

  for (const userId of [users.ownerA[0], users.editorA[0], users.spotA[0], users.spotA2[0]]) {
    await prisma.tenantMember.upsert({
      where: { tenantId_userId: { tenantId: mapA1.tenantId, userId } },
      update: { role: userId === users.ownerA[0] ? 'OWNER' : 'MEMBER' },
      create: { tenantId: mapA1.tenantId, userId, role: userId === users.ownerA[0] ? 'OWNER' : 'MEMBER' },
    })
  }
  await prisma.mapMember.upsert({
    where: { mapId_userId: { mapId: mapA1.id, userId: users.editorA[0] } },
    update: { role: 'EDITOR' },
    create: { mapId: mapA1.id, userId: users.editorA[0], role: 'EDITOR' },
  })

  const assignedSpot = await prisma.spot.findFirstOrThrow({ where: { floor: { mapId: mapA1.id } }, orderBy: { id: 'asc' } })
  await prisma.spotEditorAssignment.upsert({
    where: { spotId: assignedSpot.id },
    update: { userId: users.spotA[0], assignedById: users.ownerA[0] },
    create: { spotId: assignedSpot.id, userId: users.spotA[0], assignedById: users.ownerA[0] },
  })

  const tenantB = await prisma.tenant.upsert({
    where: { slug: 'wu40-tenant-b' },
    update: { name: 'WU40 Tenant B' },
    create: { id: 'wu40-tenant-b', slug: 'wu40-tenant-b', name: 'WU40 Tenant B' },
  })
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenantB.id, userId: users.ownerB[0] } },
    update: { role: 'OWNER' },
    create: { tenantId: tenantB.id, userId: users.ownerB[0], role: 'OWNER' },
  })
  const mapB1 = await prisma.map.upsert({
    where: { slug: 'wu40-map-b1' },
    update: { tenantId: tenantB.id, name: 'WU40 Map B1' },
    create: { id: 'wu40-map-b1', tenantId: tenantB.id, name: 'WU40 Map B1', slug: 'wu40-map-b1' },
  })
  const floorB = await prisma.mapFloor.upsert({
    where: { id: 'wu40-floor-b1' },
    update: { mapId: mapB1.id, name: 'B1 Floor', illustrationUrl: '/uploads/arimatsu-demo-map.png', imageWidth: 1448, imageHeight: 1086 },
    create: { id: 'wu40-floor-b1', mapId: mapB1.id, name: 'B1 Floor', illustrationUrl: '/uploads/arimatsu-demo-map.png', imageWidth: 1448, imageHeight: 1086 },
  })
  await prisma.spot.upsert({
    where: { id: 'wu40-spot-b1' },
    update: { floorId: floorB.id, name: 'Tenant B Private Spot', description: 'must never leak', x: 0.5, y: 0.5 },
    create: { id: 'wu40-spot-b1', floorId: floorB.id, name: 'Tenant B Private Spot', description: 'must never leak', x: 0.5, y: 0.5 },
  })

  const category = await prisma.category.upsert({
    where: { mapId_name: { mapId: mapA1.id, name: 'WU40 Duplicate' } },
    update: { order: 99 },
    create: { id: 'wu40-category-duplicate', mapId: mapA1.id, name: 'WU40 Duplicate', order: 99 },
  })
  const floorA = await prisma.mapFloor.findFirstOrThrow({ where: { mapId: mapA1.id }, orderBy: { order: 'asc' } })
  for (const [id, positioned] of [['wu40-duplicate-1', true], ['wu40-duplicate-2', false]] as const) {
    await prisma.spot.upsert({
      where: { id },
      update: { floorId: floorA.id, name: '重複スポット', description: 'WU40 duplicate warning fixture', x: positioned ? 0.82 : null, y: positioned ? 0.2 : null, isPublished: false },
      create: { id, floorId: floorA.id, name: '重複スポット', description: 'WU40 duplicate warning fixture', x: positioned ? 0.82 : null, y: positioned ? 0.2 : null, isPublished: false },
    })
    await prisma.spotCategory.upsert({ where: { spotId_categoryId: { spotId: id, categoryId: category.id } }, update: {}, create: { spotId: id, categoryId: category.id } })
  }

  console.log(JSON.stringify({
    tenantA: mapA1.tenantId,
    mapA1: mapA1.id,
    mapA1Slug: mapA1.slug,
    mapA2: mapA2.id,
    assignedSpot: assignedSpot.id,
    tenantB: tenantB.id,
    mapB1: mapB1.id,
    users: Object.fromEntries(Object.entries(users).map(([key, value]) => [key, { id: value[0], email: value[1] }])),
  }))
}

try {
  await main()
}
finally {
  await prisma.$disconnect()
}
