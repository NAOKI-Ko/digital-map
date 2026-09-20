import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildMediaManifest, sha256File, verifyMediaManifest } from './backup-lib'

const run = (command: string, args: string[]) => new Promise<void>((resolvePromise, reject) => {
  const child = spawn(command, args, { stdio: 'inherit' })
  child.once('error', reject)
  child.once('exit', code => code === 0 ? resolvePromise() : reject(new Error(`${command} exited ${code}`)))
})

async function main() {
  const argumentsList = process.argv.slice(2).filter(value => value !== '--')
  const mode = argumentsList[0]
  const mediaRoot = resolve(process.env.MEDIA_ROOT || process.env.NUXT_UPLOAD_DIR || 'public/uploads')
  const backupRoot = resolve(process.env.BACKUP_ROOT || './backups')
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  if (mode === 'backup') {
    const target = resolve(backupRoot, 'media', timestamp)
    await mkdir(target, { recursive: true })
    await writeFile(resolve(backupRoot, '.digital-map-backup-root'), '')
    const manifest = await buildMediaManifest(mediaRoot)
    const archive = resolve(target, 'media.tar.gz')
    await run('tar', ['-czf', archive, '-C', mediaRoot, '.'])
    await writeFile(resolve(target, 'manifest.json'), JSON.stringify({ timestamp, mediaRoot: 'managed-media', archiveSha256: await sha256File(archive), files: manifest }, null, 2))
    console.info(`Media backup created: ${target}`)
    return
  }
  if (mode === 'restore') {
    const source = argumentsList[1]
    const restoreRoot = process.env.RESTORE_MEDIA_ROOT
    if (!source || !restoreRoot || process.env.ALLOW_DISPOSABLE_RESTORE !== 'true') throw new Error('restore requires backup dir, RESTORE_MEDIA_ROOT, and ALLOW_DISPOSABLE_RESTORE=true')
    const target = resolve(restoreRoot)
    const document = JSON.parse(await readFile(resolve(source, 'manifest.json'), 'utf8'))
    if (await sha256File(resolve(source, 'media.tar.gz')) !== document.archiveSha256) throw new Error('Media archive checksum mismatch')
    await mkdir(target, { recursive: true })
    await run('tar', ['-xzf', resolve(source, 'media.tar.gz'), '-C', target])
    const result = await verifyMediaManifest(target, document.files)
    if (!result.valid) throw new Error(`Media restore verification failed: ${JSON.stringify(result)}`)
    console.info(`Media restore verified: ${target}`)
    return
  }
  throw new Error('mode must be backup or restore')
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Media backup failed'); process.exitCode = 1 })
