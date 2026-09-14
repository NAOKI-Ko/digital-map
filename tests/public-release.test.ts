import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadCurrentPublicSnapshot, rewriteReleaseAssets, validatePublicSnapshot } from '../server/utils/public-release'
import { immutableCacheControl, LocalPublicStorage, pointerCacheControl } from '../server/utils/public-storage'

const roots: string[] = []
afterEach(async () => { while (roots.length) await rm(roots.pop()!, { recursive: true, force: true }) })

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
    const copied = await rewriteReleaseAssets({ photos: ['/uploads/photo.jpg'] }, storage, 'public/maps/map/releases/r1', uploadRoot) as { photos: string[] }
    await unlink(join(uploadRoot, 'photo.jpg'))
    expect(copied.photos[0]).toMatch(/^\/api\/public-assets\/map\/releases\/r1\/assets\/[a-f0-9]{64}\.jpg$/)
    const objectKey = `public/maps/${copied.photos[0]!.split('/api/public-assets/')[1]}`
    expect(new TextDecoder().decode((await storage.get(objectKey))?.bytes)).toBe('immutable-photo')
  })

  it('同じassetの複数参照をrelease内で一度だけ書き込む', async () => {
    const uploadRoot = await mkdtemp(join(tmpdir(), 'release-duplicate-upload-')); roots.push(uploadRoot)
    await writeFile(join(uploadRoot, 'floor.png'), 'shared-floor')
    const put = vi.fn(async () => undefined)
    const storage = { put, get: vi.fn(async () => null) }
    const copied = await rewriteReleaseAssets({ ja: ['/uploads/floor.png'], en: { floor: '/uploads/floor.png' } }, storage, 'public/maps/map/releases/r1', uploadRoot)
    expect(put).toHaveBeenCalledTimes(1)
    expect((copied as any).ja[0]).toBe((copied as any).en.floor)
  })

  it('private/pending/admin fieldsをsnapshot検証で拒否する', () => {
    expect(validatePublicSnapshot({ map: { name: 'public' } })).toBe(true)
    expect(() => validatePublicSnapshot({ spotRevisions: [{ payload: 'draft' }] })).toThrow('PRIVATE_SNAPSHOT_FIELD')
    expect(() => validatePublicSnapshot({ passwordHash: 'secret' })).toThrow('PRIVATE_SNAPSHOT_FIELD')
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
