import 'dotenv/config'
import { createHash } from 'node:crypto'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { databaseName, sha256File } from '../backup-lib'
import { verifyPublicStorageBackup } from '../public-storage-backup-lib'

async function latestChild(directory: string, suffix?: string) {
  const entries = await readdir(directory, { withFileTypes: true })
  const candidates = entries.filter(entry => suffix ? entry.isFile() && entry.name.endsWith(suffix) : entry.isDirectory())
  const ranked = await Promise.all(candidates.map(async entry => ({ path: resolve(directory, entry.name), mtime: (await stat(resolve(directory, entry.name))).mtimeMs })))
  return ranked.sort((a, b) => b.mtime - a.mtime)[0]?.path
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  if (process.env.PUBLIC_STORAGE_DRIVER !== 'local') throw new Error('R2 baseline bundles are refused')
  const root = resolve(process.env.BASELINE_BUNDLE_ROOT || process.env.BACKUP_ROOT || '')
  if (!process.env.BASELINE_BUNDLE_ROOT && !process.env.BACKUP_ROOT) throw new Error('BASELINE_BUNDLE_ROOT or BACKUP_ROOT is required')
  const dbDump = process.env.BASELINE_DB_DUMP || await latestChild(resolve(root, 'db'), '.dump')
  const media = process.env.BASELINE_MEDIA_BACKUP || await latestChild(resolve(root, 'media'))
  const publicStorage = process.env.BASELINE_PUBLIC_BACKUP || await latestChild(resolve(root, 'public'))
  if (!dbDump || !media || !publicStorage) throw new Error('Complete DB + Media + Public baseline components are required')

  const dbSha256 = await sha256File(dbDump)
  const mediaManifest = JSON.parse(await readFile(resolve(media, 'manifest.json'), 'utf8'))
  if (!Array.isArray(mediaManifest.files) || await sha256File(resolve(media, 'media.tar.gz')) !== mediaManifest.archiveSha256) throw new Error('Media backup verification failed')
  const publicManifest = await verifyPublicStorageBackup(publicStorage)
  const createdAt = new Date().toISOString()
  const appSha = process.env.APP_COMMIT_SHA || process.env.DEPLOYED_SHA || 'unknown'
  await writeFile(`${dbDump}.json`, JSON.stringify({ timestamp: createdAt, commitSha: appSha, sha256: dbSha256, format: 'custom', createdBy: 'WU-53 verified bundle' }, null, 2))

  const aliases = ['ARIMATSU_FON_EMAIL', 'ARIMATSU_TAMA_EMAIL', 'ARIMATSU_NAU_EMAIL'].map((name, index) => process.env[name] || ['fon@arimatsu.test', 'tama@arimatsu.test', 'nau@arimatsu.test'][index])
  const manifest = {
    version: 1,
    createdAt,
    appSha,
    databaseName: databaseName(process.env.DATABASE_URL),
    components: {
      db: { path: `db/${basename(dbDump)}`, sha256: dbSha256 },
      media: { path: `media/${basename(media)}`, archiveSha256: mediaManifest.archiveSha256, files: mediaManifest.files.length },
      public: { path: `public/${basename(publicStorage)}`, archiveSha256: publicManifest.archiveSha256, files: publicManifest.files.length },
    },
    topology: { users: 3, workspaces: 3, maps: 3, spotsPerMap: 16, workspaceNames: ['有松マップ｜ふぉん', '有松マップ｜たま', '有松マップ｜なう'], publicSlugs: ['arimatsu-fon', 'arimatsu-tama', 'arimatsu-nau'] },
    loginAliases: aliases,
  }
  const manifestText = JSON.stringify(manifest, null, 2) + '\n'
  await writeFile(resolve(root, 'baseline-manifest.json'), manifestText)
  const checksums = [
    `${dbSha256}  ${manifest.components.db.path}`,
    `${mediaManifest.archiveSha256}  ${manifest.components.media.path}/media.tar.gz`,
    `${publicManifest.archiveSha256}  ${manifest.components.public.path}/public-storage.tar.gz`,
    `${createHash('sha256').update(manifestText).digest('hex')}  baseline-manifest.json`,
  ].join('\n') + '\n'
  await writeFile(resolve(root, 'checksums.sha256'), checksums)
  const marker = { verified: true, databaseName: manifest.databaseName, createdAt, components: { db: true, media: true, public: true }, paths: { db: dbDump, media, public: publicStorage }, manifestSha256: createHash('sha256').update(manifestText).digest('hex') }
  await writeFile(resolve(root, 'verified-backup-marker.json'), JSON.stringify(marker, null, 2) + '\n')
  console.info(JSON.stringify({ status: 'PASS', root, databaseName: manifest.databaseName, components: manifest.components }, null, 2))
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Baseline bundle creation failed'); process.exitCode = 1 })
