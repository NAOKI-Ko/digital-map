import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import { extname, relative, resolve, sep } from 'node:path'
import type { PublicMap } from '~~/shared/types/public-map'
import { isMapLocale, mapLocales } from '~~/shared/constants/map-languages'
import { uploadedImageUrlSchema } from '~~/shared/schemas/photo'
import { appendAuditEvent } from './audit'
import { notifyOperations, operationalLog } from './observability'
import { prisma } from './prisma'
import { getLivePublicMapById } from './public-map'
import { getPublicStorage, immutableCacheControl, pointerCacheControl, type PublicObjectStorage, type PublicWriteResult } from './public-storage'

type ReleaseLocales = { ja: PublicMap } & Record<string, PublicMap>
type CurrentPointer = { releaseId: string | null, manifestKey: string | null, published: boolean, updatedAt: string }
const publicationTransactionOptions = { maxWait: 5_000, timeout: 20_000 } as const

export function releaseRoot(slug: string, releaseId: string) { return `public/maps/${slug}/releases/${releaseId}` }
export function currentPointerKey(slug: string) { return `public/maps/${slug}/current.json` }

function parseJson<T>(bytes: Uint8Array): T { return JSON.parse(new TextDecoder().decode(bytes)) as T }

async function copyReleaseAsset(value: string, storage: PublicObjectStorage, root: string, uploadDirectory: string, copied: Map<string, string>, writes: Map<string, Promise<PublicWriteResult>>) {
  const parsed = uploadedImageUrlSchema.safeParse(value)
  if (!parsed.success || value.includes('\\') || /%(?:2e|2f|5c)/i.test(value)) throw new Error('INVALID_PUBLIC_ASSET_URL')
  const uploadRoot = await realpath(resolve(uploadDirectory))
  const sourcePath = await realpath(resolve(uploadRoot, value.slice('/uploads/'.length)))
  const relativePath = relative(uploadRoot, sourcePath)
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`) || resolve(uploadRoot, relativePath) !== sourcePath) throw new Error('PUBLIC_ASSET_OUTSIDE_UPLOAD_ROOT')
  const cached = copied.get(value)
  if (cached) return cached
  const source = await readFile(sourcePath)
  const extension = extname(sourcePath).toLowerCase()
  const hash = createHash('sha256').update(source).digest('hex')
  const filename = `${hash}${extension}`
  const publicUrl = `/api/public-assets/${root.slice('public/maps/'.length)}/assets/${filename}`
  copied.set(value, publicUrl)
  const objectKey = `${root}/assets/${filename}`
  let write = writes.get(objectKey)
  if (!write) {
    write = storage.put(objectKey, source, { contentType: extension === '.webp' ? 'image/webp' : extension === '.png' ? 'image/png' : 'image/jpeg', cacheControl: immutableCacheControl })
    writes.set(objectKey, write)
  }
  await write
  return publicUrl
}

async function rewritePublicMapAssets(map: PublicMap, storage: PublicObjectStorage, root: string, uploadDirectory: string, copied: Map<string, string>, writes: Map<string, Promise<PublicWriteResult>>): Promise<PublicMap> {
  const rewriteOptional = async (value: string | null) => value === null ? null : copyReleaseAsset(value, storage, root, uploadDirectory, copied, writes)
  return {
    ...map,
    logoUrl: await rewriteOptional(map.logoUrl),
    seo: { ...map.seo, imageUrl: await rewriteOptional(map.seo.imageUrl) },
    floors: await Promise.all(map.floors.map(async floor => ({
      ...floor,
      illustrationUrl: await copyReleaseAsset(floor.illustrationUrl, storage, root, uploadDirectory, copied, writes),
      decorations: await Promise.all(floor.decorations.map(async decoration => ({ ...decoration, imageUrl: await copyReleaseAsset(decoration.imageUrl, storage, root, uploadDirectory, copied, writes) }))),
      spots: await Promise.all(floor.spots.map(async spot => ({
        ...spot,
        photos: await Promise.all(spot.photos.map(photo => copyReleaseAsset(photo, storage, root, uploadDirectory, copied, writes))),
        pinIconImageUrl: await rewriteOptional(spot.pinIconImageUrl),
        categories: await Promise.all(spot.categories.map(async category => ({ ...category, iconImageUrl: await rewriteOptional(category.iconImageUrl) }))),
      }))),
    }))),
  }
}

export async function rewriteReleaseAssets(value: ReleaseLocales, storage: PublicObjectStorage, root: string, uploadDirectory: string): Promise<ReleaseLocales> {
  const copied = new Map<string, string>()
  const writes = new Map<string, Promise<PublicWriteResult>>()
  return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([locale, map]) => [locale, await rewritePublicMapAssets(map, storage, root, uploadDirectory, copied, writes)]))) as ReleaseLocales
}

export function validatePublicSnapshot(snapshot: unknown) {
  const forbiddenKeys = new Set(['passwordHash', 'tokenHash', 'auditEvents', 'spotRevisions', 'tenantMembers', 'fieldValueTranslations'])
  const inspect = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) inspect(item)
      return
    }
    if (!value || typeof value !== 'object') return
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.has(key)) throw new Error(`PRIVATE_SNAPSHOT_FIELD:${key}`)
      inspect(child)
    }
  }
  inspect(snapshot)
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
      for (const locale of mapLocales.filter(item => item !== 'ja' && mapRecord.enabledLocales.includes(item))) {
        result[locale] = (await getLivePublicMapById(mapId, locale, transaction)) ?? ja
      }
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
  const current = await storage.get(currentPointerKey(slug))
  const result = await storage.put(currentPointerKey(slug), JSON.stringify(pointer), {
    contentType: 'application/json; charset=utf-8',
    cacheControl: pointerCacheControl,
    ifMatchEtag: current?.etag,
    ifNoneMatch: !current,
  })
  return { previous: current, writtenEtag: result.etag }
}

export async function compensatePointer(
  storage: PublicObjectStorage,
  slug: string,
  previous: Awaited<ReturnType<PublicObjectStorage['get']>>,
  writtenEtag: string | undefined,
  fallback: CurrentPointer,
) {
  if (!writtenEtag) return false
  try {
    await storage.put(
      currentPointerKey(slug),
      previous?.bytes ?? JSON.stringify(fallback),
      {
        contentType: previous?.contentType ?? 'application/json; charset=utf-8',
        cacheControl: previous?.cacheControl ?? pointerCacheControl,
        ifMatchEtag: writtenEtag,
      },
    )
    return true
  }
  catch (error) {
    if (error instanceof Error && error.message === 'PUBLIC_OBJECT_PRECONDITION_FAILED') return false
    throw error
  }
}

export async function activatePublicRelease(mapId: string, releaseId: string, tenantId: string, actorUserId: string, storage = getPublicStorage()) {
  const transition: { pointerWrite?: Awaited<ReturnType<typeof putPointer>>, pointerSlug?: string } = {}
  try {
    return await prisma.$transaction(async (transaction) => {
      // PostgreSQL transaction advisory locks serialize only this Map. The lock is
      // intentionally held across the bounded pointer write so successful DB and
      // pointer states cannot be reordered by another application process.
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`public-map:${mapId}`}, 0))`
      const release = await transaction.publicRelease.findFirst({ where: { id: releaseId, mapId, status: 'READY' }, include: { map: { select: { slug: true, currentReleaseId: true } } } })
      if (!release?.manifestKey) throw createError({ statusCode: 404, statusMessage: '公開可能なリリースが見つかりません。' })
      transition.pointerSlug = release.map.slug
      transition.pointerWrite = await putPointer(storage, transition.pointerSlug, { releaseId, manifestKey: release.manifestKey, published: true, updatedAt: new Date().toISOString() })
      await transaction.map.update({ where: { id: mapId }, data: { currentReleaseId: releaseId, isPublished: true } })
      await appendAuditEvent(transaction, { tenantId, actorUserId, action: release.map.currentReleaseId ? 'MAP_RELEASE_ROLLED_BACK' : 'MAP_PUBLISHED', targetType: 'Map', targetId: mapId, mapId, metadata: { releaseId, previousReleaseId: release.map.currentReleaseId } })
      return release
    }, publicationTransactionOptions)
  }
  catch (error) {
    if (transition.pointerWrite && transition.pointerSlug) {
      const compensated = await compensatePointer(storage, transition.pointerSlug, transition.pointerWrite.previous, transition.pointerWrite.writtenEtag, { releaseId: null, manifestKey: null, published: false, updatedAt: new Date().toISOString() })
      const code = compensated ? 'PUBLIC_POINTER_COMPENSATED' : 'PUBLIC_POINTER_COMPENSATION_SKIPPED'
      operationalLog('error', { code, route: 'publish', message: compensated ? 'DB activation failed after pointer update' : 'A newer pointer prevented stale compensation', mapId })
      await notifyOperations({ code, route: 'publish', message: compensated ? 'DB activation failed after pointer update' : 'A newer pointer prevented stale compensation' })
    }
    throw error
  }
}

export async function unpublishCurrentMap(mapId: string, tenantId: string, actorUserId: string, storage = getPublicStorage()) {
  const transition: { pointerWrite?: Awaited<ReturnType<typeof putPointer>>, pointerSlug?: string } = {}
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`public-map:${mapId}`}, 0))`
      const map = await transaction.map.findUnique({ where: { id: mapId }, select: { slug: true, currentReleaseId: true } })
      if (!map) throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
      transition.pointerSlug = map.slug
      transition.pointerWrite = await putPointer(storage, transition.pointerSlug, { releaseId: map.currentReleaseId, manifestKey: null, published: false, updatedAt: new Date().toISOString() })
      await transaction.map.update({ where: { id: mapId }, data: { isPublished: false } })
      await appendAuditEvent(transaction, { tenantId, actorUserId, action: 'MAP_UNPUBLISHED', targetType: 'Map', targetId: mapId, mapId, metadata: { isPublished: false } })
    }, publicationTransactionOptions)
  }
  catch (error) {
    if (transition.pointerWrite && transition.pointerSlug) await compensatePointer(storage, transition.pointerSlug, transition.pointerWrite.previous, transition.pointerWrite.writtenEtag, { releaseId: null, manifestKey: null, published: false, updatedAt: new Date().toISOString() })
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
  const map = isMapLocale(locale) && release.locales[locale] ? release.locales[locale] : release.locales.ja
  return { ...map, releaseId: pointer.releaseId ?? undefined }
}

export async function loadReadyPublicSnapshot(manifestKey: string, releaseId: string, locale: unknown, storage = getPublicStorage()) {
  const manifest = await storage.get(manifestKey)
  if (!manifest) throw new Error('READY_RELEASE_MANIFEST_MISSING')
  const release = parseJson<{ locales: ReleaseLocales }>(manifest.bytes)
  const map = isMapLocale(locale) && release.locales[locale] ? release.locales[locale] : release.locales.ja
  return { ...map, releaseId }
}
