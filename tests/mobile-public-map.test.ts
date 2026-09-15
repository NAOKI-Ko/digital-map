import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createFloorSwitchState, shouldShowFloorSelector } from '../app/utils/public-map-ui'

const publicPage = readFileSync(new URL('../app/pages/[mapSlug]/index.vue', import.meta.url), 'utf8')
const floorSelector = readFileSync(new URL('../app/components/map/PublicFloorSelector.vue', import.meta.url), 'utf8')
const info = readFileSync(new URL('../app/components/map/PublicMapInfo.vue', import.meta.url), 'utf8')
const detail = readFileSync(new URL('../app/components/map/SpotDetailCard.vue', import.meta.url), 'utf8')

describe('公開Mapのモバイル契約', () => {
  it('Spot一覧を公開画面から機能ごと削除する', () => {
    expect(publicPage).not.toContain('SpotAccessibleList')
    expect(publicPage).not.toContain('Spot一覧から選ぶ')
    expect(() => readFileSync(new URL('../app/components/map/SpotAccessibleList.vue', import.meta.url), 'utf8')).toThrow()
  })

  it('フロアが1件ならselectorを出さず、2件以上で出す', () => {
    expect(shouldShowFloorSelector(1)).toBe(false)
    expect(shouldShowFloorSelector(2)).toBe(true)
    expect(floorSelector).toContain('v-if="floors.length > 1"')
  })

  it('フロア切替でSpot詳細とCategory選択を解除する', () => {
    expect(createFloorSwitchState('f1', 'f2')).toEqual({ floorId: 'f2', selectedSpotId: null, selectedCategoryIds: [] })
    expect(createFloorSwitchState('f1', 'f1')).toBeNull()
  })

  it('Info内から利用規約とPrivacyに到達できる', () => {
    expect(info).toContain('to="/terms"')
    expect(info).toContain('to="/privacy"')
    expect(publicPage).not.toContain('<NuxtLink to="/terms"')
  })

  it('Spot詳細はcollapsedからexpandedへ展開できる', () => {
    expect(detail).toContain('const expanded = ref(false)')
    expect(detail).toContain('@click="expanded = !expanded"')
    expect(detail).toContain("expanded ? 'max-h-[82svh] overflow-y-auto' : 'max-h-36 overflow-hidden'")
  })

  it('選択時にmarker DOMを作り直さず重なりPINへclickが移らない', () => {
    const viewer = readFileSync(new URL('../app/composables/useMapViewer.ts', import.meta.url), 'utf8')
    expect(viewer).toContain('watch(() => options.selectedSpotId.value, syncSpotMarkerSelection)')
    expect(viewer).not.toContain('watch(() => options.selectedSpotId.value, syncSpotMarkers)')
  })

  it('モバイルはheaderなしでMapが100svhを使いCategoryを1行scrollする', () => {
    const category = readFileSync(new URL('../app/components/map/CategoryFilter.vue', import.meta.url), 'utf8')
    const mapViewer = readFileSync(new URL('../app/components/map/MapViewer.vue', import.meta.url), 'utf8')
    expect(publicPage).toContain('hidden h-14')
    expect(publicPage).toContain('h-[100svh]')
    expect(category).toContain('overflow-x-auto')
    expect(category).not.toContain('overflowCategories')
    expect(mapViewer).toContain(':style="{ height }"')
    expect(mapViewer).toContain('class="h-full w-full transition-opacity duration-150"')
  })
})
