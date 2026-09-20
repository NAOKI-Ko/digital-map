import 'dotenv/config'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { assertSafeQaPath } from './qa/arimatsu-baseline-lib'
import { verifyPublicStorageBackup, verifyRestoredPublicStorage } from './public-storage-backup-lib'

async function main() {
  const source = process.argv.slice(2).find(value => value !== '--')
  const restoreRoot = process.env.RESTORE_PUBLIC_STORAGE_ROOT
  if (process.env.PUBLIC_STORAGE_DRIVER !== 'local') throw new Error('Public Storage restore only supports the local driver; R2 is refused')
  if (!source || !restoreRoot || process.env.ALLOW_DISPOSABLE_RESTORE !== 'true') throw new Error('restore requires backup dir, RESTORE_PUBLIC_STORAGE_ROOT, and ALLOW_DISPOSABLE_RESTORE=true')
  const target = assertSafeQaPath(restoreRoot, 'Public Storage restore root')
  if (resolve(target) === resolve(process.env.PUBLIC_STORAGE_ROOT || './storage/public')) throw new Error('Disposable restore cannot target active Public Storage')
  const manifest = await verifyPublicStorageBackup(source)
  await mkdir(target, { recursive: true })
  await new Promise<void>((ok, fail) => {
    const child = spawn('tar', ['-xzf', resolve(source, 'public-storage.tar.gz'), '-C', target], { stdio: 'inherit' })
    child.once('error', fail)
    child.once('exit', code => code === 0 ? ok() : fail(new Error(`tar exited ${code}`)))
  })
  await verifyRestoredPublicStorage(target, manifest)
  console.info(`Public Storage restore verified: ${target}`)
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Public Storage restore failed'); process.exitCode = 1 })
