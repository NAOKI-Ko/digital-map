import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../server/utils/prisma'
import { activatePublicRelease, currentPointerKey, unpublishCurrentMap } from '../server/utils/public-release'
import { LocalPublicStorage, pointerCacheControl } from '../server/utils/public-storage'

const databaseConfigured = Boolean(process.env.DATABASE_URL)
const integration = databaseConfigured ? describe : describe.skip

integration('PostgreSQL-backed same-map publication serialization', () => {
  const suffix = randomUUID().replaceAll('-', '')
  const tenantId = `tenant-${suffix}`
  const userId = `user-${suffix}`
  const mapId = `map-${suffix}`
  const slug = `publication-${suffix}`
  let storageRoot = ''
  let storage: LocalPublicStorage

  beforeAll(async () => {
    storageRoot = await mkdtemp(join(tmpdir(), 'publication-integration-'))
    storage = new LocalPublicStorage(storageRoot)
    await prisma.tenant.create({ data: { id: tenantId, name: 'Publication integration', slug: `tenant-${suffix}` } })
    await prisma.user.create({ data: { id: userId, email: `${suffix}@example.test`, passwordHash: 'not-a-real-secret' } })
    await prisma.map.create({ data: { id: mapId, tenantId, name: 'Publication map', slug } })
    await prisma.publicRelease.createMany({ data: [
      { id: `r1-${suffix}`, mapId, createdBy: userId, status: 'READY', manifestKey: `public/maps/${slug}/releases/r1/manifest.json`, readyAt: new Date() },
      { id: `r2-${suffix}`, mapId, createdBy: userId, status: 'READY', manifestKey: `public/maps/${slug}/releases/r2/manifest.json`, readyAt: new Date() },
    ] })
  })

  afterAll(async () => {
    await prisma.map.update({
      where: { id: mapId },
      data: { currentReleaseId: null, isPublished: false },
    })
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.user.delete({ where: { id: userId } })
    if (storageRoot) await rm(storageRoot, { recursive: true, force: true })
  })

  async function assertCoherent() {
    const map = await prisma.map.findUniqueOrThrow({ where: { id: mapId }, select: { isPublished: true, currentReleaseId: true } })
    const object = await storage.get(currentPointerKey(slug))
    expect(object).not.toBeNull()
    const pointer = JSON.parse(new TextDecoder().decode(object!.bytes)) as { published: boolean, releaseId: string | null, manifestKey: string | null }
    expect(pointer.published).toBe(map.isPublished)
    expect(pointer.releaseId).toBe(map.currentReleaseId)
    expect(Boolean(pointer.manifestKey)).toBe(map.isPublished)
  }

  it('publish vs publish completes with one coherent final release', async () => {
    await Promise.all([
      activatePublicRelease(mapId, `r1-${suffix}`, tenantId, userId, storage),
      activatePublicRelease(mapId, `r2-${suffix}`, tenantId, userId, storage),
    ])
    await assertCoherent()
  })

  it('publish vs unpublish and unpublish vs publish remain coherent', async () => {
    await Promise.all([
      activatePublicRelease(mapId, `r1-${suffix}`, tenantId, userId, storage),
      unpublishCurrentMap(mapId, tenantId, userId, storage),
    ])
    await assertCoherent()
    await Promise.all([
      unpublishCurrentMap(mapId, tenantId, userId, storage),
      activatePublicRelease(mapId, `r2-${suffix}`, tenantId, userId, storage),
    ])
    await assertCoherent()
  })

  it('storage precondition failure does not change DB publication state', async () => {
    await activatePublicRelease(mapId, `r1-${suffix}`, tenantId, userId, storage)
    const before = await prisma.map.findUniqueOrThrow({ where: { id: mapId }, select: { isPublished: true, currentReleaseId: true } })
    const failingStorage = {
      get: storage.get.bind(storage),
      put: async () => { throw new Error('PUBLIC_OBJECT_PRECONDITION_FAILED') },
    }
    await expect(activatePublicRelease(mapId, `r2-${suffix}`, tenantId, userId, failingStorage)).rejects.toThrow('PUBLIC_OBJECT_PRECONDITION_FAILED')
    expect(await prisma.map.findUniqueOrThrow({ where: { id: mapId }, select: { isPublished: true, currentReleaseId: true } })).toEqual(before)
    await assertCoherent()
  })

  it('DB failure after pointer write compensates to the previous pointer', async () => {
    await activatePublicRelease(mapId, `r1-${suffix}`, tenantId, userId, storage)
    const beforePointer = await storage.get(currentPointerKey(slug))
    await expect(activatePublicRelease(mapId, `r2-${suffix}`, 'missing-tenant', userId, storage)).rejects.toThrow()
    expect(new TextDecoder().decode((await storage.get(currentPointerKey(slug)))!.bytes)).toBe(new TextDecoder().decode(beforePointer!.bytes))
    await assertCoherent()
  })
})
