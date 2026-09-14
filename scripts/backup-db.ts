import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { sha256File } from './backup-lib'

function run(command: string, args: string[], env: NodeJS.ProcessEnv, capture = false) {
  return new Promise<string>((resolvePromise, reject) => {
    let output = ''
    const child = spawn(command, args, { env, stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' })
    if (capture) { child.stdout?.on('data', value => { output += value }); child.stderr?.on('data', value => { output += value }) }
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolvePromise(output.trim()) : reject(new Error(`pg_dump failed with exit code ${code}`)))
  })
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const database = new URL(process.env.DATABASE_URL)
  const backupRoot = resolve(process.env.BACKUP_ROOT || './backups')
  const directory = resolve(backupRoot, 'db')
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(backupRoot, '.digital-map-backup-root'), '')
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const dump = resolve(directory, `digital-map-${timestamp}.dump`)
  const command = process.env.PG_DUMP_PATH || 'pg_dump'
  const environment = { ...process.env, PGPASSWORD: decodeURIComponent(database.password) }
  const connectionArgs = ['--host', database.hostname, '--port', database.port || '5432', '--username', decodeURIComponent(database.username), '--dbname', database.pathname.slice(1), '--no-password']
  await run(command, ['--format=custom', `--file=${dump}`, ...connectionArgs], environment)
  const version = await run(command, ['--version'], environment, true)
  const commitSha = process.env.APP_COMMIT_SHA || process.env.DEPLOYED_SHA || 'unknown'
  await writeFile(`${dump}.json`, JSON.stringify({ timestamp, commitSha, sha256: await sha256File(dump), postgresVersion: version, format: 'custom' }))
  console.info(`DB backup created: ${dump}`)
}

main().catch((error) => { console.error(error instanceof Error ? error.message : 'DB backup failed'); process.exitCode = 1 })
