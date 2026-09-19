import { createHash } from 'node:crypto'
import { lstat, readdir, readFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

export interface MediaManifestEntry { path: string, size: number, sha256: string }

export function canonicalDatabaseTarget(value: string) {
  const url = new URL(value)
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') throw new Error('Only PostgreSQL restore URLs are supported')
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (!database) throw new Error('Database name is required')
  return `postgresql://${url.hostname.toLowerCase()}:${url.port || '5432'}/${database}`
}

export function databaseName(value: string) {
  const url = new URL(value)
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') throw new Error('Only PostgreSQL restore URLs are supported')
  const name = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (!name) throw new Error('Database name is required')
  return name
}

export function safeRelativePath(root: string, candidate: string) {
  const value = relative(resolve(root), resolve(candidate)).split(sep).join('/')
  if (!value || value === '..' || value.startsWith('../')) throw new Error('Path escapes the configured root')
  return value
}

export async function sha256File(path: string) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

export async function buildMediaManifest(root: string): Promise<MediaManifestEntry[]> {
  const entries: MediaManifestEntry[] = []
  async function visit(directory: string) {
    for (const name of (await readdir(directory)).sort()) {
      const path = resolve(directory, name)
      const info = await lstat(path)
      if (info.isSymbolicLink()) throw new Error(`Symlinks are not supported: ${name}`)
      if (info.isDirectory()) await visit(path)
      else if (info.isFile()) entries.push({ path: safeRelativePath(root, path), size: info.size, sha256: await sha256File(path) })
    }
  }
  await visit(resolve(root))
  return entries
}

export async function verifyMediaManifest(root: string, manifest: MediaManifestEntry[]) {
  const actual = await buildMediaManifest(root)
  const expected = new Map(manifest.map(entry => [entry.path, entry]))
  const actualPaths = new Set(actual.map(entry => entry.path))
  const missing = manifest.filter(entry => !actual.some(file => file.path === entry.path)).map(entry => entry.path)
  const mismatched = actual.filter(file => { const target = expected.get(file.path); return target && (target.size !== file.size || target.sha256 !== file.sha256) }).map(file => file.path)
  const unexpected = actual.filter(file => !expected.has(file.path)).map(file => file.path)
  return { valid: missing.length === 0 && mismatched.length === 0 && unexpected.length === 0, missing, mismatched, unexpected, actualCount: actualPaths.size, expectedCount: expected.size }
}

export function retentionPlan(files: Array<{ path: string, timestamp: Date }>, daily = 7, weekly = 4) {
  const sorted = [...files].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const keep = new Set(sorted.slice(0, daily).map(item => item.path))
  const weeks = new Set<string>()
  for (const item of sorted) {
    const date = item.timestamp
    const first = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    const week = `${date.getUTCFullYear()}-${Math.ceil((((date.getTime() - first.getTime()) / 86400000) + first.getUTCDay() + 1) / 7)}`
    if (weeks.size < weekly && !weeks.has(week)) { weeks.add(week); keep.add(item.path) }
  }
  return { keep: sorted.filter(item => keep.has(item.path)), remove: sorted.filter(item => !keep.has(item.path)) }
}
