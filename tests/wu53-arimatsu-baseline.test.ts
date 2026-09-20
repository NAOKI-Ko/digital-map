import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createPublicStorageBackup, verifyPublicStorageBackup, verifyRestoredPublicStorage } from '../scripts/public-storage-backup-lib'
import { ARIMATSU_SPOTS, ARIMATSU_USERS, ARIMATSU_WORKSPACES, RESET_CONFIRMATION, assertSafeQaPath, validatePrebackupMarker, validateResetEnvironment } from '../scripts/qa/arimatsu-baseline-lib'

const safeEnv = () => ({
  QA_BASELINE_ENV: 'local',
  ALLOW_QA_BASELINE_RESET: RESET_CONFIRMATION,
  DATABASE_URL: 'postgresql://qa:secret@localhost:5432/digital_map_qa',
  EXPECTED_DATABASE_NAME: 'digital_map_qa',
  PUBLIC_STORAGE_DRIVER: 'local',
  PUBLIC_STORAGE_ROOT: '/tmp/digital-map-qa/public',
  NUXT_UPLOAD_DIR: '/tmp/digital-map-qa/media',
  QA_BASELINE_PREBACKUP_MARKER: '/tmp/digital-map-qa/verified.json',
} satisfies NodeJS.ProcessEnv)

describe('WU-53 guarded Arimatsu QA baseline', () => {
  it('defines the exact three users/workspaces and one canonical 16-spot dataset', () => {
    expect(ARIMATSU_USERS.map(user => user.displayName)).toEqual(['ふぉん', 'たま', 'なう'])
    expect(ARIMATSU_WORKSPACES.map(item => item.mapSlug)).toEqual(['arimatsu-fon', 'arimatsu-tama', 'arimatsu-nau'])
    expect(ARIMATSU_SPOTS).toHaveLength(16)
    expect(new Set(ARIMATSU_SPOTS.map(spot => spot.name)).size).toBe(16)
    expect(ARIMATSU_SPOTS.every(spot => spot.sources.length > 0)).toBe(true)
  })

  it('refuses missing confirmation, wrong DB, R2, unsafe roots, and missing prebackup', () => {
    expect(() => validateResetEnvironment({ ...safeEnv(), ALLOW_QA_BASELINE_RESET: undefined })).toThrow('confirmation')
    expect(() => validateResetEnvironment({ ...safeEnv(), EXPECTED_DATABASE_NAME: 'production' })).toThrow('does not match')
    expect(() => validateResetEnvironment({ ...safeEnv(), PUBLIC_STORAGE_DRIVER: 'r2' })).toThrow('R2 is refused')
    expect(() => validateResetEnvironment({ ...safeEnv(), QA_BASELINE_ENV: 'windows-qa', DEPLOYMENT_ENV: 'production' })).toThrow('Production')
    expect(() => validateResetEnvironment({ ...safeEnv(), QA_BASELINE_ENV: 'windows-qa', DEPLOYMENT_ENV: 'development' })).toThrow('DEPLOYMENT_ENV=qa')
    expect(() => validateResetEnvironment({ ...safeEnv(), PUBLIC_STORAGE_ROOT: '/' })).toThrow('unsafe broad path')
    expect(() => validateResetEnvironment({ ...safeEnv(), QA_BASELINE_PREBACKUP_MARKER: undefined })).toThrow('backup marker')
  })

  it('keeps the append-only audit trigger intact and scopes TRUNCATE to the guarded QA reset tool', () => {
    const reset = readFileSync('scripts/qa/arimatsu-baseline-reset.ts', 'utf8')
    expect(reset).toContain('validateResetEnvironment(process.env)')
    expect(reset).toContain('TRUNCATE TABLE')
    expect(reset).not.toContain('DROP TRIGGER')
    expect(reset).not.toContain('prevent_audit_event_mutation')
  })

  it('requires a verified three-component marker for the exact database', () => {
    const valid = { verified: true, databaseName: 'digital_map_qa', createdAt: '2026-09-20T00:00:00.000Z', components: { db: true, media: true, public: true }, paths: { db: '/backup/db', media: '/backup/media', public: '/backup/public' } }
    expect(() => validatePrebackupMarker(valid, 'digital_map_qa')).not.toThrow()
    expect(() => validatePrebackupMarker({ ...valid, databaseName: 'production' }, 'digital_map_qa')).toThrow('not verified')
    expect(() => validatePrebackupMarker({ ...valid, components: { ...valid.components, public: false } }, 'digital_map_qa')).toThrow('DB, Media, and Public')
  })

  it('backs up and verifies local Public Storage, detects corruption, and verifies a disposable restore', async () => {
    const root = await mkdtemp(join(tmpdir(), 'wu53-public-'))
    const source = join(root, 'source')
    const backup = join(root, 'backup')
    const restored = join(root, 'restored')
    await mkdir(join(source, 'public/maps/arimatsu-fon'), { recursive: true })
    await writeFile(join(source, 'public/maps/arimatsu-fon/current.json'), '{"published":true}')
    const manifest = await createPublicStorageBackup(source, backup)
    expect(await verifyPublicStorageBackup(backup)).toMatchObject({ storage: 'local-public-storage' })
    await mkdir(restored, { recursive: true })
    const { spawn } = await import('node:child_process')
    await new Promise<void>((ok, fail) => {
      const child = spawn('tar', ['-xzf', join(backup, 'public-storage.tar.gz'), '-C', restored])
      child.once('error', fail); child.once('exit', code => code === 0 ? ok() : fail(new Error(String(code))))
    })
    await expect(verifyRestoredPublicStorage(restored, manifest)).resolves.toMatchObject({ valid: true })
    await writeFile(join(backup, 'public-storage.tar.gz'), Buffer.from('corrupt'))
    await expect(verifyPublicStorageBackup(backup)).rejects.toThrow('checksum mismatch')
    expect(assertSafeQaPath(join(root, 'safe'), 'test')).toContain(root)
    expect(await readFile(join(restored, 'public/maps/arimatsu-fon/current.json'), 'utf8')).toContain('published')
  })
})
