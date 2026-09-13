import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const listSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/spots/index.vue', import.meta.url), 'utf8')
const apiSource = readFileSync(new URL('../server/api/maps/[mapId]/spots/index.get.ts', import.meta.url), 'utf8')

describe('Spot一覧ナビゲーション', () => {
  it('名前・Category・配置・公開フィルターと3種sortを提供する', () => {
    for (const value of ['categoryId', 'positioned', 'unpositioned', 'published', 'draft', 'updated', 'name', 'created']) expect(listSource).toContain(value)
    expect(apiSource).toContain("query.sort === 'name'")
  })

  it('検索をdebounceしてURLへ保存し、詳細往復とbulk refreshで文脈を維持する', () => {
    expect(listSource).toContain('setTimeout(search, 250)')
    expect(listSource).toContain('query: { returnTo: route.fullPath }')
    expect(listSource).toContain('sessionStorage.setItem')
  })

  it('同名Spotをフロア・配置・Categoryで識別し地図上のPINを選択できる', () => {
    expect(listSource).toContain('{{ spot.floorName }} · 配置済み')
    expect(listSource).toContain('v-for="category in spot.categories"')
    expect(listSource).toContain('placeSpotId: spot.id')
  })
})
