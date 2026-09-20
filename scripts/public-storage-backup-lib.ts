import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildMediaManifest, sha256File, verifyMediaManifest } from './backup-lib'

export async function createPublicStorageBackup(sourceRoot: string, targetDirectory: string) {
  const root = resolve(sourceRoot)
  const target = resolve(targetDirectory)
  await mkdir(root, { recursive: true })
  await mkdir(target, { recursive: true })
  const files = await buildMediaManifest(root)
  const archivePath = resolve(target, 'public-storage.tar.gz')
  const { spawn } = await import('node:child_process')
  await new Promise<void>((ok, fail) => {
    const child = spawn('tar', ['-czf', archivePath, '-C', root, '.'], { stdio: 'inherit' })
    child.once('error', fail)
    child.once('exit', code => code === 0 ? ok() : fail(new Error(`tar exited ${code}`)))
  })
  const manifest = { version: 1, createdAt: new Date().toISOString(), storage: 'local-public-storage', archiveSha256: await sha256File(archivePath), files }
  await writeFile(resolve(target, 'manifest.json'), JSON.stringify(manifest, null, 2))
  return manifest
}

export async function verifyPublicStorageBackup(sourceDirectory: string) {
  const source = resolve(sourceDirectory)
  const manifest = JSON.parse(await readFile(resolve(source, 'manifest.json'), 'utf8'))
  if (manifest.storage !== 'local-public-storage' || !Array.isArray(manifest.files)) throw new Error('Invalid Public Storage backup manifest')
  if (await sha256File(resolve(source, 'public-storage.tar.gz')) !== manifest.archiveSha256) throw new Error('Public Storage archive checksum mismatch')
  return manifest
}

export async function verifyRestoredPublicStorage(root: string, manifest: { files: Array<{ path: string, size: number, sha256: string }> }) {
  const result = await verifyMediaManifest(resolve(root), manifest.files)
  if (!result.valid) throw new Error(`Public Storage restore verification failed: ${JSON.stringify(result)}`)
  return result
}
