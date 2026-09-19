import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { compensatePointer, loadCurrentPublicSnapshot, rewriteReleaseAssets, validatePublicSnapshot } from '../server/utils/public-release'
import { immutableCacheControl, LocalPublicStorage, pointerCacheControl } from '../server/utils/public-storage'
import type { PublicMap } from '../shared/types/public-map'

const roots: string[] = []
afterEach(async () => { while (roots.length) await rm(roots.pop()!, { recursive: true, force: true }) })

function publicMap(overrides: Partial<PublicMap> = {}): PublicMap {
  return {
    id: 'map-1', name: 'Map', slug: 'map', locale: 'ja', defaultLocale: 'ja', enabledLocales: ['ja'],
    seo: { title: 'Map', description: '/uploads/text.png', imageUrl: null },
    organizationName: null, logoUrl: null, websiteUrl: null, snsUrl: null, floors: [],
    ...overrides,
  }
}

describe('CDN-first public release', () => {
  it('Snapshotが出力する/releases階層とimmutable asset配信routeが一致する', () => {
    const route = fileURLToPath(new URL('../server/routes/api/public-assets/[mapSlug]/releases/[releaseId]/assets/[filename].get.ts', import.meta.url))
    expect(existsSync(route)).toBe(true)
  })

  it('immutable objectは同一内容だけ冪等で、上書きを拒否する', async () => {
    const root = await mkdtemp(join(tmpdir(), 'public-storage-')); roots.push(root)
    const storage = new LocalPublicStorage(root)
    await storage.put('public/maps/map/releases/r1/manifest.json', 'one', { contentType: 'application/json', cacheControl: immutableCacheControl })
    await storage.put('public/maps/map/releases/r1/manifest.json', 'one', { contentType: 'application/json', cacheControl: immutableCacheControl })
    await expect(storage.put('public/maps/map/releases/r1/manifest.json', 'two', { contentType: 'application/json', cacheControl: immutableCacheControl })).rejects.toThrow('IMMUTABLE')
  })

  it('current pointerは短期再検証で、locale snapshotをDBなしに選ぶ', async () => {
    const root = await mkdtemp(join(tmpdir(), 'public-pointer-')); roots.push(root)
    const storage = new LocalPublicStorage(root)
    const manifestKey = 'public/maps/map/releases/r1/manifest.json'
    await storage.put(manifestKey, JSON.stringify({ locales: { ja: { name: '日本語' }, en: { name: 'English' } } }), { contentType: 'application/json', cacheControl: immutableCacheControl })
    await storage.put('public/maps/map/current.json', JSON.stringify({ releaseId: 'r1', manifestKey, published: true }), { contentType: 'application/json', cacheControl: pointerCacheControl })
    expect(await loadCurrentPublicSnapshot('map', 'en', storage)).toMatchObject({ name: 'English' })
    expect((await storage.get('public/maps/map/current.json'))?.cacheControl).toBe(pointerCacheControl)
  })

  it('release assetをcontent hash名へコピーし、原本削除後も残す', async () => {
    const uploadRoot = await mkdtemp(join(tmpdir(), 'release-upload-')); roots.push(uploadRoot)
    const storageRoot = await mkdtemp(join(tmpdir(), 'release-storage-')); roots.push(storageRoot)
    await writeFile(join(uploadRoot, 'photo.jpg'), 'immutable-photo')
    const storage = new LocalPublicStorage(storageRoot)
    const copied = await rewriteReleaseAssets({ ja: publicMap({ floors: [{
      id: 'floor', name: 'Floor', illustrationUrl: '/uploads/photo.jpg', imageWidth: 1, imageHeight: 1, order: 0,
      refAImageX: null, refAImageY: null, refALat: null, refALng: null, refBImageX: null, refBImageY: null, refBLat: null, refBLng: null,
      spots: [], decorations: [],
    }] }) }, storage, 'public/maps/map/releases/r1', uploadRoot)
    await unlink(join(uploadRoot, 'photo.jpg'))
    const assetUrl = copied.ja.floors[0]!.illustrationUrl
    expect(assetUrl).toMatch(/^\/api\/public-assets\/map\/releases\/r1\/assets\/[a-f0-9]{64}\.jpg$/)
    const objectKey = `public/maps/${assetUrl.split('/api/public-assets/')[1]}`
    expect(new TextDecoder().decode((await storage.get(objectKey))?.bytes)).toBe('immutable-photo')
  })

  it('同じassetの複数参照をrelease内で一度だけ書き込む', async () => {
    const uploadRoot = await mkdtemp(join(tmpdir(), 'release-duplicate-upload-')); roots.push(uploadRoot)
    await writeFile(join(uploadRoot, 'floor.png'), 'shared-floor')
    const put = vi.fn(async () => ({}))
    const storage = { put, get: vi.fn(async () => null) }
    const floor = { id: 'floor', name: 'Floor', illustrationUrl: '/uploads/floor.png', imageWidth: 1, imageHeight: 1, order: 0, refAImageX: null, refAImageY: null, refALat: null, refALng: null, refBImageX: null, refBImageY: null, refBLat: null, refBLng: null, spots: [], decorations: [] }
    const copied = await rewriteReleaseAssets({ ja: publicMap({ floors: [floor] }), en: publicMap({ locale: 'en', floors: [floor] }) }, storage, 'public/maps/map/releases/r1', uploadRoot)
    expect(put).toHaveBeenCalledTimes(1)
    expect(copied.ja.floors[0]!.illustrationUrl).toBe(copied.en.floors[0]!.illustrationUrl)
  })

  it('private/pending/admin fieldsをsnapshot検証で拒否する', () => {
    expect(validatePublicSnapshot({ map: { name: 'public' } })).toBe(true)
    expect(() => validatePublicSnapshot({ spotRevisions: [{ payload: 'draft' }] })).toThrow('PRIVATE_SNAPSHOT_FIELD')
    expect(() => validatePublicSnapshot({ passwordHash: 'secret' })).toThrow('PRIVATE_SNAPSHOT_FIELD')
    expect(() => validatePublicSnapshot({ nested: [{ tokenHash: 'secret' }] })).toThrow('PRIVATE_SNAPSHOT_FIELD')
    expect(validatePublicSnapshot({ description: 'passwordHash is an internal concept', values: ['passwordHash', 'tokenHash', 'auditEvents', 'spotRevisions', 'tenantMembers', 'fieldValueTranslations'] })).toBe(true)
  })

  it('既知のasset fieldだけを書き換え、upload root外や不正URLを拒否する', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'release-security-')); roots.push(parent)
    const uploadRoot = join(parent, 'uploads')
    const storageRoot = join(parent, 'storage')
    await mkdir(uploadRoot); await mkdir(storageRoot)
    for (const name of ['floor.png', 'logo.png', 'photo.jpg', 'category.webp', 'pin.png', 'decoration.png']) await writeFile(join(uploadRoot, name), name)
    await writeFile(join(parent, 'outside.png'), 'outside-secret')
    const storage = new LocalPublicStorage(storageRoot)
    const map = publicMap({
      logoUrl: '/uploads/logo.png',
      seo: { title: 'Map', description: '/uploads/photo.jpg', imageUrl: '/uploads/photo.jpg' },
      floors: [{
        id: 'floor', name: 'Floor', illustrationUrl: '/uploads/floor.png', imageWidth: 1, imageHeight: 1, order: 0,
        refAImageX: null, refAImageY: null, refALat: null, refALng: null, refBImageX: null, refBImageY: null, refBLat: null, refBLng: null,
        decorations: [{ id: 'dec', imageUrl: '/uploads/decoration.png', imageWidth: 1, imageHeight: 1, x: 0, y: 0, width: 1, rotation: 0, order: 0 }],
        spots: [{
          id: 'spot', floorId: 'floor', name: 'Spot', categories: [{ id: 'cat', name: 'Cat', order: 0, iconType: 'custom', iconPresetId: null, iconImageUrl: '/uploads/category.webp' }], importance: 'normal',
          description: '/uploads/foo.png', x: 0.5, y: 0.5, photos: ['/uploads/photo.jpg'], informationFields: [{ id: 'text', label: 'Text', type: 'single_line_text', value: '/uploads/photo.jpg', href: null }], websiteAction: null,
          pinIconType: 'custom', pinIconId: null, pinIconImageUrl: '/uploads/pin.png', pinColor: '#000000', pinSize: 'medium',
        }],
      }],
    })
    const copied = await rewriteReleaseAssets({ ja: map }, storage, 'public/maps/map/releases/r1', uploadRoot)
    expect(copied.ja.seo.description).toBe('/uploads/photo.jpg')
    expect(copied.ja.floors[0]!.spots[0]!.description).toBe('/uploads/foo.png')
    expect(copied.ja.floors[0]!.spots[0]!.informationFields[0]!.value).toBe('/uploads/photo.jpg')
    for (const url of [copied.ja.logoUrl, copied.ja.seo.imageUrl, copied.ja.floors[0]!.illustrationUrl, copied.ja.floors[0]!.spots[0]!.photos[0], copied.ja.floors[0]!.spots[0]!.pinIconImageUrl, copied.ja.floors[0]!.spots[0]!.categories[0]!.iconImageUrl, copied.ja.floors[0]!.decorations[0]!.imageUrl]) expect(url).toMatch(/^\/api\/public-assets\//)

    for (const invalid of ['/uploads/../../outside.png', '/uploads/..\\outside.png', '/uploads/%2e%2e%2foutside.png', '/uploads//absolute-like.png', '/uploads/file.gif', '/tmp/outside.png']) {
      await expect(rewriteReleaseAssets({ ja: publicMap({ logoUrl: invalid }) }, storage, 'public/maps/map/releases/r2', uploadRoot)).rejects.toThrow('INVALID_PUBLIC_ASSET_URL')
    }
    await expect(rewriteReleaseAssets({ ja: publicMap({ logoUrl: '/uploads/missing.png' }) }, storage, 'public/maps/map/releases/r2', uploadRoot)).rejects.toThrow()
    await symlink(join(parent, 'outside.png'), join(uploadRoot, 'linked.png'))
    await expect(rewriteReleaseAssets({ ja: publicMap({ logoUrl: '/uploads/linked.png' }) }, storage, 'public/maps/map/releases/r2', uploadRoot)).rejects.toThrow('PUBLIC_ASSET_OUTSIDE_UPLOAD_ROOT')
    expect((await readFile(join(parent, 'outside.png'), 'utf8'))).toBe('outside-secret')
  })

  it('local pointerの同一predecessor条件付きwriteは一方だけ成功する', async () => {
    const root = await mkdtemp(join(tmpdir(), 'public-pointer-cas-')); roots.push(root)
    const storage = new LocalPublicStorage(root)
    const key = 'public/maps/map/current.json'
    const options = { contentType: 'application/json', cacheControl: pointerCacheControl }
    await storage.put(key, 'original', options)
    const predecessor = await storage.get(key)
    const results = await Promise.allSettled([
      storage.put(key, 'first', { ...options, ifMatchEtag: predecessor!.etag }),
      storage.put(key, 'second', { ...options, ifMatchEtag: predecessor!.etag }),
    ])
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1)
    expect(new TextDecoder().decode((await storage.get(key))!.bytes)).toMatch(/^(first|second)$/)
  })

  it('古いpublish失敗のcompensationが新しいcurrent pointerを巻き戻さない', async () => {
    const root = await mkdtemp(join(tmpdir(), 'public-pointer-race-')); roots.push(root)
    const storage = new LocalPublicStorage(root)
    const key = 'public/maps/map/current.json'
    const options = { contentType: 'application/json', cacheControl: pointerCacheControl }
    const original = JSON.stringify({ releaseId: 'r0', manifestKey: 'r0.json', published: true })
    const stale = JSON.stringify({ releaseId: 'r1', manifestKey: 'r1.json', published: true })
    const newest = JSON.stringify({ releaseId: 'r2', manifestKey: 'r2.json', published: true })
    await storage.put(key, original, options)
    const beforeStale = await storage.get(key)
    const staleWrite = await storage.put(key, stale, { ...options, ifMatchEtag: beforeStale?.etag })
    const beforeNewest = await storage.get(key)
    await storage.put(key, newest, { ...options, ifMatchEtag: beforeNewest?.etag })

    await expect(storage.put(key, original, { ...options, ifMatchEtag: staleWrite.etag }))
      .rejects.toThrow('PUBLIC_OBJECT_PRECONDITION_FAILED')
    expect(await compensatePointer(storage, 'map', beforeStale, staleWrite.etag, {
      releaseId: null,
      manifestKey: null,
      published: false,
      updatedAt: new Date().toISOString(),
    })).toBe(false)
    expect(JSON.parse(new TextDecoder().decode((await storage.get(key))?.bytes))).toMatchObject({ releaseId: 'r2' })
  })

  it('公開viewer APIは通常表示でPrisma/live DBへfallbackしない', async () => {
    const source = await readFile(new URL('../server/api/public/[mapSlug]/index.get.ts', import.meta.url), 'utf8')
    expect(source).toContain('loadCurrentPublicSnapshot')
    expect(source).not.toContain('prisma')
    expect(source).not.toContain('getPublicMapBySlug')
  })

  it('publishはmanifest完成後にREADY/pointer/DBを進め、DB失敗時にcompensationする', async () => {
    const source = await readFile(new URL('../server/utils/public-release.ts', import.meta.url), 'utf8')
    expect(source.indexOf("status: 'READY'")).toBeLessThan(source.indexOf('putPointer(storage'))
    expect(source).toContain('PUBLIC_POINTER_COMPENSATED')
    expect(source).toContain("status: 'FAILED'")
    expect(source).toContain("status: 'READY'")
  })
})
