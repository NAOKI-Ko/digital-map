import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const dashboard = readFileSync('app/pages/admin/dashboard/index.vue', 'utf8')
const navigation = readFileSync('app/components/admin/AdminNavigation.vue', 'utf8')
const navigationModel = readFileSync('app/utils/admin-navigation.ts', 'utf8')
const spotForm = readFileSync('app/components/admin/SpotForm.vue', 'utf8')
const newSpot = readFileSync('app/pages/admin/maps/[mapId]/spots/new.vue', 'utf8')
const editSpot = readFileSync('app/pages/admin/maps/[mapId]/spots/[spotId]/index.vue', 'utf8')

describe('WU-50 UI alignment contracts', () => {
  it('one accessible map bypasses map-list selection and second-map CTA', () => {
    expect(dashboard).toContain('maps.value.length === 1')
    expect(dashboard).toContain('await navigateTo(`/admin/maps/${maps.value[0]!.id}`')
    expect(dashboard).not.toContain('新しいマップ')
    expect(dashboard).not.toContain('v-for="map in maps"')
  })

  it('workspace navigation replaces sidebar selectors and real map stays disabled', () => {
    expect(navigation).toContain('ワークスペースを切り替える')
    expect(navigation).not.toContain('Mapを切り替える')
    expect(navigation).not.toContain('<select')
    expect(navigation).toContain('/admin/workspaces')
    expect(navigation).toContain('item.disabled')
    expect(navigationModel).toContain("status: '準備中'")
  })

  it('real-world coordinates are editable while illustration x/y stay hidden', () => {
    expect(spotForm).toContain('位置情報')
    expect(spotForm).toContain('v-model="lat"')
    expect(spotForm).toContain('v-model="lng"')
    expect(spotForm).toContain('緯度・経度は実地図表示用です')
    expect(spotForm).not.toContain('v-model="x"')
    expect(spotForm).not.toContain('v-model="y"')
    expect(newSpot).toContain('lat: null')
    expect(editSpot).toContain('lat: data.value.spot.lat')
  })
})
