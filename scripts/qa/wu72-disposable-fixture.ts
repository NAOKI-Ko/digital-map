import { copyFile, mkdir } from 'node:fs/promises'
import bcrypt from 'bcryptjs'
import sharp from 'sharp'
import { prisma } from '../../server/utils/prisma'
import { ensureDefaultSpotFieldDefinitions } from '../../server/utils/spot-field'
const url = new URL(process.env.DATABASE_URL ?? '')
if (!['localhost','127.0.0.1'].includes(url.hostname) || !url.pathname.startsWith('/digital_map_test_')) throw Error('Disposable local DB only')
const tenantId = 'wu72-browser', zeroTenant = 'wu72-zero', ownerId = 'wu72-owner', editorId = 'wu72-editor'
const passwordHash = await bcrypt.hash('WU72-Disposable-QA-Only!', 10)
await prisma.tenant.createMany({ data: [{ id: tenantId, name: 'WU72 配置QA', slug: tenantId }, { id: zeroTenant, name: 'WU72 0 Map', slug: zeroTenant }] })
await prisma.user.createMany({ data: [{ id: ownerId, email: 'wu72-owner@example.invalid', displayName: 'WU72 Owner', passwordHash, emailVerifiedAt: new Date() }, { id: editorId, email: 'wu72-editor@example.invalid', displayName: 'WU72 Editor', passwordHash, emailVerifiedAt: new Date() }] })
await prisma.tenantMember.createMany({ data: [{ tenantId, userId: ownerId, role: 'OWNER' }, { tenantId: zeroTenant, userId: ownerId, role: 'OWNER' }, { tenantId, userId: editorId, role: 'MEMBER' }] })
await prisma.map.createMany({ data: [{ id: 'wu72-map-a', tenantId, name: 'Aquarium 配置QA', slug: 'wu72-aquarium' }, { id: 'wu72-map-b', tenantId, name: '別Map', slug: 'wu72-second' }] })
await prisma.mapMember.create({ data: { mapId: 'wu72-map-a', userId: editorId } })
const root = '.local-data/uploads'
await mkdir(root, { recursive: true })
await copyFile('assets/visitor-maps/nagoya-aquarium/north-2f-master.png', `${root}/wu72-aquarium.png`)
const metadata = await sharp(`${root}/wu72-aquarium.png`).metadata()
await prisma.mapFloor.createMany({ data: ['wu72-floor-1','wu72-floor-2'].map((id, order) => ({ id, mapId: 'wu72-map-a', name: order ? '2F' : '1F', order, illustrationUrl: '/uploads/wu72-aquarium.png', imageWidth: metadata.width!, imageHeight: metadata.height! })) })
await prisma.$transaction(async tx => { await ensureDefaultSpotFieldDefinitions(tx, 'wu72-map-a'); await ensureDefaultSpotFieldDefinitions(tx, 'wu72-map-b') })
await prisma.category.create({ data: { id: 'wu72-category', tenantId, mapId: 'wu72-map-a', name: '展示' } })
await prisma.spot.create({ data: { id: 'wu72-content', tenantId, floorId: 'wu72-floor-1', name: '共有の展示', description: '同じ本文を二つのフロアから確認します。', x: .45, y: .5, isPublished: true, spotCategories: { create: { categoryId: 'wu72-category' } } } })
await prisma.illustrationPlacement.create({ data: { usageId: 'usage_wu72-content', floorId: 'wu72-floor-2', x: .7, y: .4 } })
for (let i=0; i<3; i++) await prisma.spot.create({ data: { id: `wu72-dense-${i}`, tenantId, floorId: 'wu72-floor-1', name: `密集展示 ${i+1}`, x: .45+i*.002, y: .5+i*.002, isPublished: true, importance: i === 0 ? 'featured' : 'normal' } })
console.log('Disposable browser fixture ready: 0/2 Maps, Map ACL, two Floors, canonical Spot with two occurrences, dense collision fixture.')
await prisma.$disconnect()
