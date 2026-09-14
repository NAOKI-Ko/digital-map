import { readdir, stat, unlink, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { retentionPlan, safeRelativePath } from './backup-lib'

async function main() {
  const root = resolve(process.env.BACKUP_ROOT || './backups')
  await access(resolve(root, '.digital-map-backup-root'))
  const dbRoot = resolve(root, 'db')
  const candidates = []
  for (const name of await readdir(dbRoot).catch(() => [] as string[])) {
    if (!/^digital-map-\d{8}T\d{6}Z\.dump$/.test(name)) continue
    const path = resolve(dbRoot, name)
    safeRelativePath(root, path)
    candidates.push({ path, timestamp: (await stat(path)).mtime })
  }
  const plan = retentionPlan(candidates, Number(process.env.BACKUP_RETENTION_DAILY || 7), Number(process.env.BACKUP_RETENTION_WEEKLY || 4))
  console.info(JSON.stringify({ dryRun: process.argv[2] !== '--apply', keep: plan.keep.map(item => item.path), remove: plan.remove.map(item => item.path) }, null, 2))
  if (process.argv[2] === '--apply') for (const item of plan.remove) { await unlink(item.path); await unlink(`${item.path}.json`).catch(() => undefined) }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Retention failed'); process.exitCode = 1 })
