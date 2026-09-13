import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mapCreateSchema } from '../shared/schemas/map'

const newMapSource = readFileSync(new URL('../app/pages/admin/maps/new.vue', import.meta.url), 'utf8')
const setupSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/setup.vue', import.meta.url), 'utf8')
const createApiSource = readFileSync(new URL('../server/api/maps/index.post.ts', import.meta.url), 'utf8')
const prismaSource = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')

describe('イラストマップ作成セットアップ', () => {
  it('Phase 1 APIはillustrationだけを受け付ける', () => {
    expect(mapCreateSchema.safeParse({ mapType: 'illustration', name: '有松', slug: 'arimatsu' }).success).toBe(true)
    expect(mapCreateSchema.safeParse({ mapType: 'real', name: '有松', slug: 'arimatsu' }).success).toBe(false)
  })

  it('リアルマップを無効表示し今後対応予定と説明する', () => {
    expect(newMapSource).toContain('リアルマップ')
    expect(newMapSource).toContain('今後対応予定')
    expect(newMapSource).toContain('aria-disabled="true"')
  })

  it('公開パスを明示指定し、Spot標準項目を自動初期化する', () => {
    expect(createApiSource).toContain('slug: input.slug')
    expect(createApiSource).toContain('defaultSpotFieldDefinitions')
  })

  it('Category候補はopt-inで、任意ジオリファレンスを完了条件にしない', () => {
    for (const name of ['観光', '飲食', '買い物', '宿泊', '交通', 'トイレ', '駐車場']) expect(setupSource).toContain(name)
    expect(setupSource).toContain('自動追加はされません')
    expect(setupSource).toContain('ジオリファレンスは任意')
  })

  it('GEO Map用の永続モデルを追加しない', () => {
    expect(prismaSource).not.toMatch(/mapType\s+String/)
  })
})
