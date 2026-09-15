import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
const ids = ['wu45-pin-existing', 'wu45-pin-new'] as const

async function setup() {
  const floor = await prisma.mapFloor.findFirstOrThrow({
    where: { map: { slug: 'team-demo-arimatsu' } },
    orderBy: { order: 'asc' },
  })

  await prisma.spot.upsert({
    where: { id: ids[0] },
    update: {
      floorId: floor.id,
      name: 'WU45 既存PIN fixture',
      description: 'Disposable WU-45 browser QA fixture',
      x: 0.14,
      y: 0.84,
      pinIconType: 'preset',
      pinIconId: 'landmark',
      pinIconImageUrl: null,
      pinIconAssetId: null,
      pinColor: '#2563EB',
      pinSize: 'small',
      importance: 'normal',
      isPublished: false,
    },
    create: {
      id: ids[0],
      floorId: floor.id,
      name: 'WU45 既存PIN fixture',
      description: 'Disposable WU-45 browser QA fixture',
      x: 0.14,
      y: 0.84,
      pinIconType: 'preset',
      pinIconId: 'landmark',
      pinColor: '#2563EB',
      pinSize: 'small',
      importance: 'normal',
      isPublished: false,
    },
  })

  await prisma.spot.upsert({
    where: { id: ids[1] },
    update: {
      floorId: floor.id,
      name: 'WU45 新規配置 fixture',
      description: 'Disposable WU-45 browser QA fixture',
      x: null,
      y: null,
      pinIconType: 'preset',
      pinIconId: 'shopping',
      pinIconImageUrl: null,
      pinIconAssetId: null,
      pinColor: '#047857',
      pinSize: 'medium',
      importance: 'normal',
      isPublished: false,
    },
    create: {
      id: ids[1],
      floorId: floor.id,
      name: 'WU45 新規配置 fixture',
      description: 'Disposable WU-45 browser QA fixture',
      pinIconType: 'preset',
      pinIconId: 'shopping',
      pinColor: '#047857',
      pinSize: 'medium',
      importance: 'normal',
      isPublished: false,
    },
  })
}

async function inspect() {
  const spots = await prisma.spot.findMany({
    where: { id: { in: [...ids] } },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      floorId: true,
      x: true,
      y: true,
      pinIconType: true,
      pinIconId: true,
      pinIconImageUrl: true,
      pinIconAssetId: true,
      pinColor: true,
      pinSize: true,
      importance: true,
      isPublished: true,
    },
  })
  console.log(JSON.stringify(spots, null, 2))
}

async function cleanup() {
  const result = await prisma.spot.deleteMany({ where: { id: { in: [...ids] } } })
  console.log(JSON.stringify({ deleted: result.count, ids }))
}

const action = process.argv[2]
try {
  if (action === 'setup') await setup()
  else if (action === 'inspect') await inspect()
  else if (action === 'cleanup') await cleanup()
  else throw new Error('Usage: wu45-pin-editor-fixture.ts <setup|inspect|cleanup>')
}
finally {
  await prisma.$disconnect()
}
