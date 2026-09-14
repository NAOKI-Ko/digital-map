import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import type { PublicMap } from '~~/shared/types/public-map'
import { appendAuditEvent } from './audit'
import { notifyOperations, operationalLog } from './observability'
import { getLivePublicMapById } from './public-map'
import { getPublicStorage, immutableCacheControl, pointerCacheControl, type PublicObjectStorage } from './public-storage'

type ReleaseLocales = { ja: PublicMap, en?: PublicMap }
type CurrentPointer = { releaseId: string | null, manifestKey: string | null, published: boolean, updatedAt: string }

export function releaseRoot(slug: string, releaseId: string) { return `public/maps/${slug}/releases/${releaseId}` }
export function currentPointerKey(slug: string) { return `public/maps/${slug}/current.json` }

function parseJson<T>(bytes: Uint8Array): T { return JSON.parse(new TextDecoder().decode(bytes)) as T }

export async function rewriteReleaseAssets(value: unknown, storage: PublicObjectStorage, root: string, uploadDirectory: string, copied = new Map<string, string>()): Promise<unknown> {
  if (typeof value === 'string' && value.startsWith('/uploads/')) {
    const cached = copied.get(value)
    if (cached) return cached
    const source = await readFile(resolve(uploadDirectory, value.slice('/uploads/'.length)))
    const extension = extname(value).toLowerCase()
    const hash = createHash('sha256').update(source).digest('hex')
    const filename = `${hash}${extension}`
    await storage.put(`${root}/assets/${filename}`, source, { contentType: extension === '.webp' ? 'image/webp' : extension === '.png' ? 'image/png' : 'image/jpeg', cacheControl: immutableCacheControl })
    const publicUrl = `/api/public-assets/${root.slice('public/maps/'.length)}/assets/${filename}`
    copied.set(value, publicUrl)
    return publicUrl
  }
  if (Array.isArray(value)) return Promise.all(value.map(item => rewriteReleaseAssets(item, storage, root, uploadDirectory, copied)))
  if (value && typeof value === 'object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, child]) => [key, await rewriteReleaseAssets(child, storage, root, uploadDirectory, copied)])))
  return value
}

export function validatePublicSnapshot(snapshot: unknown) {
  const serialized = JSON.stringify(snapshot)
  for (const forbidden of ['passwordHash', 'tokenHash', 'auditEvents', 'spotRevisions', 'tenantMembers', 'fieldValueTranslations']) if (serialized.includes(forbidden)) throw new Error(`PRIVATE_SNAPSHOT_FIELD:${forbidden}`)
  return true
}

export async function buildPublicRelease(mapId: string, actorUserId: string, uploadDirectory: string, storage = getPublicStorage()) {
  const mapRecord = await prisma.map.findUnique({ where: { id: mapId }, select: { id: true, slug: true, enabledLocales: true } })
  if (!mapRecord) throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  const release = await prisma.publicRelease.create({ data: { mapId, createdBy: actorUserId, status: 'BUILDING' } })
  const root = releaseRoot(mapRecord.slug, release.id)
  try {
    const locales = await prisma.$transaction(async (transaction) => {
      const ja = await getLivePublicMapById(mapId, 'ja', transaction)
      if (!ja) throw new Error('SNAPSHOT_SOURCE_NOT_FOUND')
      const result: ReleaseLocales = { ja }
      if (mapRecord.enabledLocales.includes('en')) result.en = (await getLivePublicMapById(mapId, 'en', transaction)) ?? ja
      return result
    }, { isolationLevel: 'RepeatableRead' })
    validatePublicSnapshot(locales)
    const copied = await rewriteReleaseAssets(locales, storage, root, uploadDirectory) as ReleaseLocales
    const manifestKey = `${root}/manifest.json`
    await storage.put(manifestKey, JSON.stringify({ releaseId: release.id, mapSlug: mapRecord.slug, locales: copied }), { contentType: 'application/json; charset=utf-8', cacheControl: immutableCacheControl })
    await prisma.publicRelease.update({ where: { id: release.id }, data: { status: 'READY', manifestKey, readyAt: new Date() } })
    return { ...release, status: 'READY', manifestKey, slug: mapRecord.slug }
  }
  catch (error) {
    await prisma.publicRelease.update({ where: { id: release.id }, data: { status: 'FAILED', failureMetadata: { code: error instanceof Error ? error.message.slice(0, 100) : 'BUILD_FAILED' } } }).catch(() => undefined)
    operationalLog('error', { code: 'PUBLIC_RELEASE_BUILD_FAILED', route: 'publish', message: 'Public release build failed', mapId })
    await notifyOperations({ code: 'PUBLIC_RELEASE_BUILD_FAILED', route: 'publish', message: 'Public release build failed' })
    throw error
  }
}

async function putPointer(storage: PublicObjectStorage, slug: string, pointer: CurrentPointer) {
  await storage.put(currentPointerKey(slug), JSON.stringify(pointer), { contentType: 'application/json; charset=utf-8', cacheControl: pointerCacheControl })
}

export async function activatePublicRelease(mapId: string, releaseId: string, tenantId: string, actorUserId: string, storage = getPublicStorage()) {
  const release = await prisma.publicRelease.findFirst({ where: { id: releaseId, mapId, status: 'READY' }, include: { map: { select: { slug: true, currentReleaseId: true } } } })
  if (!release?.manifestKey) throw createError({ statusCode: 404, statusMessage: '公開可能なリリースが見つかりません。' })
  const oldObject = await storage.get(currentPointerKey(release.map.slug))
  await putPointer(storage, release.map.slug, { releaseId, manifestKey: release.manifestKey, published: true, updatedAt: new Date().toISOString() })
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.map.update({ where: { id: mapId }, data: { currentReleaseId: releaseId, isPublished: true } })
      await appendAuditEvent(transaction, { tenantId, actorUserId, action: release.map.currentReleaseId ? 'MAP_RELEASE_ROLLED_BACK' : 'MAP_PUBLISHED', targetType: 'Map', targetId: mapId, mapId, metadata: { releaseId, previousReleaseId: release.map.currentReleaseId } })
    })
  }
  catch (error) {
    if (oldObject) await storage.put(currentPointerKey(release.map.slug), oldObject.bytes, { contentType: oldObject.contentType, cacheControl: oldObject.cacheControl })
    else await putPointer(storage, release.map.slug, { releaseId: null, manifestKey: null, published: false, updatedAt: new Date().toISOString() })
    operationalLog('error', { code: 'PUBLIC_POINTER_COMPENSATED', route: 'publish', message: 'DB activation failed after pointer update', mapId })
    await notifyOperations({ code: 'PUBLIC_POINTER_COMPENSATED', route: 'publish', message: 'DB activation failed after pointer update' })
    throw error
  }
  return release
}

export async function unpublishCurrentMap(mapId: string, tenantId: string, actorUserId: string, storage = getPublicStorage()) {
  const map = await prisma.map.findUnique({ where: { id: mapId }, select: { slug: true, currentReleaseId: true } })
  if (!map) throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  const old = await storage.get(currentPointerKey(map.slug))
  await putPointer(storage, map.slug, { releaseId: map.currentReleaseId, manifestKey: null, published: false, updatedAt: new Date().toISOString() })
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.map.update({ where: { id: mapId }, data: { isPublished: false } })
      await appendAuditEvent(transaction, { tenantId, actorUserId, action: 'MAP_UNPUBLISHED', targetType: 'Map', targetId: mapId, mapId, metadata: { isPublished: false } })
    })
  }
  catch (error) {
    if (old) await storage.put(currentPointerKey(map.slug), old.bytes, { contentType: old.contentType, cacheControl: old.cacheControl })
    throw error
  }
}

export async function loadCurrentPublicSnapshot(slug: string, locale: unknown, storage = getPublicStorage()) {
  const pointerObject = await storage.get(currentPointerKey(slug))
  if (!pointerObject) return null
  const pointer = parseJson<CurrentPointer>(pointerObject.bytes)
  if (!pointer.published || !pointer.manifestKey) return null
  const manifest = await storage.get(pointer.manifestKey)
  if (!manifest) throw new Error('CURRENT_RELEASE_MANIFEST_MISSING')
  const release = parseJson<{ locales: ReleaseLocales }>(manifest.bytes)
  const map = locale === 'en' && release.locales.en ? release.locales.en : release.locales.ja
  return { ...map, releaseId: pointer.releaseId ?? undefined }
}
