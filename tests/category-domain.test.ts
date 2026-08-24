import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')
const migration = readFileSync(
  new URL('../prisma/migrations/20260824000000_add_category_domain/migration.sql', import.meta.url),
  'utf8',
)

describe('Category domain schema', () => {
  it('Map単位Categoryとmany-to-many relationの制約を持つ', () => {
    expect(schema).toContain('@@unique([mapId, name])')
    expect(schema).toContain('@@index([mapId, order])')
    expect(schema).toContain('@@id([spotId, categoryId])')
    expect(schema).toContain('@@index([categoryId])')
  })

  it('移行期間中はlegacy Spot.categoryを維持する', () => {
    expect(schema).toMatch(/model Spot \{[\s\S]*?category\s+String/)
  })
})

describe('Category backfill migration', () => {
  it('Map境界とtrim済み完全一致でCategory relationを作る', () => {
    expect(migration).toContain('btrim(s."category")')
    expect(migration).toContain('c."mapId" = f."mapId"')
    expect(migration).toContain('c."name" = btrim(s."category")')
  })

  it('既存Category文字列を意味的に分割しない', () => {
    expect(migration).not.toMatch(/regexp_split|split_part|string_to_array/i)
  })

  it('Map内の名称順でdeterministicなorderを割り当てる', () => {
    expect(migration).toContain('row_number() OVER (PARTITION BY "mapId" ORDER BY "name") - 1')
  })
})
