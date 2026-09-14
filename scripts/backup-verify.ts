import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { sha256File } from './backup-lib'

async function main() {
  const dbDump = process.argv[2]
  const mediaBackup = process.argv[3]
  if (!dbDump && !mediaBackup) throw new Error('Usage: backup:verify [db.dump] [media-backup-directory]')
  if (dbDump) {
    const metadata = JSON.parse(await readFile(`${dbDump}.json`, 'utf8'))
    if (await sha256File(dbDump) !== metadata.sha256) throw new Error('DB backup checksum mismatch')
  }
  if (mediaBackup) {
    const manifest = JSON.parse(await readFile(resolve(mediaBackup, 'manifest.json'), 'utf8'))
    if (!Array.isArray(manifest.files)) throw new Error('Invalid media manifest')
    if (await sha256File(resolve(mediaBackup, 'media.tar.gz')) !== manifest.archiveSha256) throw new Error('Media archive checksum mismatch')
  }
  console.info('Backup verification PASS')
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Backup verification failed'); process.exitCode = 1 })
