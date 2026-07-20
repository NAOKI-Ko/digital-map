import { randomUUID } from 'node:crypto'

export function createMapSlug(name: string) {
  const base = name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)

  return `${base || 'map'}-${randomUUID().slice(0, 8)}`
}
