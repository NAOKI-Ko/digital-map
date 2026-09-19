import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mapCapabilitySchema, mapCreateSchema } from '../shared/schemas/map'

const newMapSource = readFileSync(new URL('../app/pages/admin/maps/new.vue', import.meta.url), 'utf8')
const setupSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/setup.vue', import.meta.url), 'utf8')
const createApiSource = readFileSync(new URL('../server/api/maps/index.post.ts', import.meta.url), 'utf8')
const tenantDataSource = readFileSync(new URL('../server/utils/tenant-tourism-data.ts', import.meta.url), 'utf8')
const prismaSource = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')

describe('イラストマップ作成セットアップ', () => {
  it('Phase 1 APIはillustrationだけを受け付ける', () => {
    expect(mapCreateSchema.safeParse({ mapType: 'illustration', name: '有松', slug: 'arimatsu' }).success).toBe(true)
    expect(mapCreateSchema.safeParse({ mapType: 'real', name: '有松', slug: 'arimatsu' }).success).toBe(false)
  })

  it('Map種別選択をせずリアルマップを今後対応予定と説明する', () => {
    expect(newMapSource).toContain('リアルマップ')
    expect(newMapSource).toContain('今後対応予定')
    expect(newMapSource).toContain('aria-disabled="true"')
    expect(newMapSource).not.toContain('selectedType')
  })

  it('公開パスを明示指定し、Spot標準項目を自動初期化する', () => {
    expect(newMapSource).toContain("mapType: 'illustration'")
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

  it('Illustration/Realの両方と有効なdefaultを表現する', () => {
    expect(mapCapabilitySchema.safeParse({ illustrationEnabled: true, realMapEnabled: false, defaultMapView: 'ILLUSTRATION' }).success).toBe(true)
    expect(mapCapabilitySchema.safeParse({ illustrationEnabled: true, realMapEnabled: true, defaultMapView: 'REAL' }).success).toBe(true)
    expect(mapCapabilitySchema.safeParse({ illustrationEnabled: false, realMapEnabled: true, defaultMapView: 'REAL' }).success).toBe(true)
    expect(mapCapabilitySchema.safeParse({ illustrationEnabled: false, realMapEnabled: false, defaultMapView: 'REAL' }).success).toBe(false)
    expect(mapCapabilitySchema.safeParse({ illustrationEnabled: true, realMapEnabled: false, defaultMapView: 'REAL' }).success).toBe(false)
  })

  it('新しい2枚目Mapをtransaction内のTenant lockで拒否する', () => {
    expect(createApiSource).toContain('assertTenantCanCreateMap')
    expect(createApiSource).toContain("statusCode: 409")
    expect(tenantDataSource).toContain('where: { tenantId }')
    expect(tenantDataSource).toContain('pg_advisory_xact_lock')
  })
})
