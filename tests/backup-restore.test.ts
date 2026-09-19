import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildMediaManifest, canonicalDatabaseTarget, retentionPlan, safeRelativePath, verifyMediaManifest } from '../scripts/backup-lib'

describe('WU-29 backup and restore helpers', () => {
  it('creates deterministic relative-path/size/SHA-256 media manifests and detects missing media', async () => {
    const root = await mkdtemp(join(tmpdir(), 'digital-map-media-'))
    await mkdir(join(root, 'nested'))
    await writeFile(join(root, 'a.png'), Buffer.from('asset-a'))
    await writeFile(join(root, 'nested', 'b.jpg'), Buffer.from('asset-b'))
    const manifest = await buildMediaManifest(root)
    expect(manifest.map(entry => entry.path)).toEqual(['a.png', 'nested/b.jpg'])
    expect(manifest.every(entry => /^[a-f0-9]{64}$/.test(entry.sha256))).toBe(true)
    expect(await verifyMediaManifest(root, manifest)).toEqual({ valid: true, missing: [], mismatched: [], unexpected: [], actualCount: 2, expectedCount: 2 })
    expect(await verifyMediaManifest(root, [...manifest, { path: 'missing.png', size: 1, sha256: '0'.repeat(64) }])).toMatchObject({ valid: false, missing: ['missing.png'] })
    await writeFile(join(root, 'unexpected.gif'), Buffer.from('not in backup'))
    expect(await verifyMediaManifest(root, manifest)).toMatchObject({ valid: false, unexpected: ['unexpected.gif'] })
  })

  it('rejects paths outside the configured backup/media root', () => {
    expect(() => safeRelativePath('/safe/root', '/safe/other/file')).toThrow('escapes')
  })

  it('identifies the same restore database even when credentials and default-port spelling differ', () => {
    expect(canonicalDatabaseTarget('postgresql://live:secret@DB.EXAMPLE/digital_map'))
      .toBe(canonicalDatabaseTarget('postgresql://restore:other@db.example:5432/digital_map'))
    expect(canonicalDatabaseTarget('postgresql://restore:other@db.example:5432/disposable'))
      .not.toBe(canonicalDatabaseTarget('postgresql://live:secret@db.example/digital_map'))
  })

  it('keeps 7 daily plus up to 4 weekly representatives and only plans older deletion', () => {
    const files = Array.from({ length: 50 }, (_, index) => ({ path: `backup-${index}`, timestamp: new Date(Date.UTC(2026, 8, 14 - index)) }))
    const plan = retentionPlan(files, 7, 4)
    expect(plan.keep.length).toBeGreaterThanOrEqual(7)
    expect(plan.keep.length).toBeLessThanOrEqual(11)
    expect(plan.keep.map(item => item.path)).toContain('backup-0')
    expect(plan.remove.length + plan.keep.length).toBe(50)
  })

  it('uses cross-platform DB commands without exposing the database URL as a process argument', () => {
    const backup = readFileSync('scripts/backup-db.ts', 'utf8')
    const restore = readFileSync('scripts/restore-db.ts', 'utf8')
    const windowsBackup = readFileSync('scripts/windows/backup.ps1', 'utf8')
    expect(backup).toContain('PGPASSWORD')
    expect(backup).not.toContain("connectionArgs = [process.env.DATABASE_URL")
    expect(restore).toContain("process.env.ALLOW_DISPOSABLE_RESTORE !== 'true'")
    expect(restore).toContain('Refusing to restore into DATABASE_URL')
    expect(windowsBackup).not.toContain('bash ')
    expect(windowsBackup).toContain('pnpm backup:verify')
    expect(windowsBackup).toContain('BACKUP_ROOT.Length -gt 120')
  })
})
