import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { assertSafeQaPath } from './qa/arimatsu-baseline-lib'
import { createPublicStorageBackup } from './public-storage-backup-lib'

async function main() {
  if (process.env.PUBLIC_STORAGE_DRIVER !== 'local') throw new Error('Public Storage backup only supports the local driver; R2 is refused')
  const source = assertSafeQaPath(process.env.PUBLIC_STORAGE_ROOT || './storage/public', 'Public storage root')
  const backupRoot = resolve(process.env.BACKUP_ROOT || './backups')
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const target = resolve(backupRoot, 'public', timestamp)
  await mkdir(backupRoot, { recursive: true })
  await writeFile(resolve(backupRoot, '.digital-map-backup-root'), '')
  await createPublicStorageBackup(source, target)
  console.info(`Public Storage backup created: ${target}`)
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Public Storage backup failed'); process.exitCode = 1 })
