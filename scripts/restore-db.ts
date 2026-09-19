import { spawn } from 'node:child_process'
import { canonicalDatabaseTarget } from './backup-lib'

async function main() {
  const source = process.argv[2]
  const targetValue = process.env.RESTORE_DATABASE_URL
  if (!source || !targetValue || process.env.ALLOW_DISPOSABLE_RESTORE !== 'true') throw new Error('restore requires dump path, RESTORE_DATABASE_URL, and ALLOW_DISPOSABLE_RESTORE=true')
  if (process.env.DATABASE_URL && canonicalDatabaseTarget(process.env.DATABASE_URL) === canonicalDatabaseTarget(targetValue)) throw new Error('Refusing to restore into DATABASE_URL')
  const target = new URL(targetValue)
  const command = process.env.PG_RESTORE_PATH || 'pg_restore'
  const args = ['--exit-on-error', '--clean', '--if-exists', '--no-owner', '--host', target.hostname, '--port', target.port || '5432', '--username', decodeURIComponent(target.username), '--dbname', target.pathname.slice(1), '--no-password', source]
  const code = await new Promise<number | null>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, PGPASSWORD: decodeURIComponent(target.password) } })
    child.once('error', reject)
    child.once('exit', resolve)
  })
  if (code !== 0) throw new Error(`pg_restore failed with exit code ${code}`)
  console.info('Disposable DB restore completed')
}

main().catch((error) => { console.error(error instanceof Error ? error.message : 'DB restore failed'); process.exitCode = 1 })
