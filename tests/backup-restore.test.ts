import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildMediaManifest, retentionPlan, safeRelativePath, verifyMediaManifest } from '../scripts/backup-lib'

describe('WU-29 backup and restore helpers', () => {
  it('creates deterministic relative-path/size/SHA-256 media manifests and detects missing media', async () => {
    const root = await mkdtemp(join(tmpdir(), 'digital-map-media-'))
    await mkdir(join(root, 'nested'))
    await writeFile(join(root, 'a.png'), Buffer.from('asset-a'))
    await writeFile(join(root, 'nested', 'b.jpg'), Buffer.from('asset-b'))
    const manifest = await buildMediaManifest(root)
    expect(manifest.map(entry => entry.path)).toEqual(['a.png', 'nested/b.jpg'])
    expect(manifest.every(entry => /^[a-f0-9]{64}$/.test(entry.sha256))).toBe(true)
    expect(await verifyMediaManifest(root, manifest)).toEqual({ valid: true, missing: [], mismatched: [] })
    expect(await verifyMediaManifest(root, [...manifest, { path: 'missing.png', size: 1, sha256: '0'.repeat(64) }])).toMatchObject({ valid: false, missing: ['missing.png'] })
  })

  it('rejects paths outside the configured backup/media root', () => {
    expect(() => safeRelativePath('/safe/root', '/safe/other/file')).toThrow('escapes')
  })

  it('keeps 7 daily plus up to 4 weekly representatives and only plans older deletion', () => {
    const files = Array.from({ length: 50 }, (_, index) => ({ path: `backup-${index}`, timestamp: new Date(Date.UTC(2026, 8, 14 - index)) }))
    const plan = retentionPlan(files, 7, 4)
    expect(plan.keep.length).toBeGreaterThanOrEqual(7)
    expect(plan.keep.length).toBeLessThanOrEqual(11)
    expect(plan.keep.map(item => item.path)).toContain('backup-0')
    expect(plan.remove.length + plan.keep.length).toBe(50)
  })
})
