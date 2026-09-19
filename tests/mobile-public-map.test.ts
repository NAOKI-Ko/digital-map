import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { closeFilteredSpot, createFloorSwitchState, selectedSpotIdFromOverlay, shouldShowFloorSelector, type PublicOverlay } from '../app/utils/public-map-ui'

const publicPage = readFileSync(new URL('../app/pages/[mapSlug]/index.vue', import.meta.url), 'utf8')
const floorSelector = readFileSync(new URL('../app/components/map/PublicFloorSelector.vue', import.meta.url), 'utf8')
const info = readFileSync(new URL('../app/components/map/PublicMapInfo.vue', import.meta.url), 'utf8')
const detail = readFileSync(new URL('../app/components/map/SpotDetailCard.vue', import.meta.url), 'utf8')
const mapViewer = readFileSync(new URL('../app/components/map/MapViewer.vue', import.meta.url), 'utf8')

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

  it('Spot/Floor/Info overlayは型として排他的で、filter対象外Spotを閉じる', () => {
    let overlay: PublicOverlay = { type: 'spot', spotId: 'spot-a' }
    expect(selectedSpotIdFromOverlay(overlay)).toBe('spot-a')
    overlay = { type: 'floor' }
    expect(selectedSpotIdFromOverlay(overlay)).toBeNull()
    overlay = { type: 'info' }
    expect(selectedSpotIdFromOverlay(overlay)).toBeNull()
    expect(closeFilteredSpot({ type: 'spot', spotId: 'spot-a' }, ['spot-b'])).toBeNull()
    expect(closeFilteredSpot({ type: 'spot', spotId: 'spot-a' }, ['spot-a'])).toEqual({ type: 'spot', spotId: 'spot-a' })
  })

  it('Info内から利用規約とPrivacyに到達できる', () => {
    expect(info).toContain('to="/terms"')
    expect(info).toContain('to="/privacy"')
    expect(publicPage).not.toContain('<NuxtLink to="/terms"')
  })

  it('PINからsummaryを挟まずdetail/expandedの本文Dialogを直接開く', () => {
    expect(detail).toContain("const sheetState = ref<BottomSheetState>('detail')")
    expect(detail).toContain("sheetState.value === 'expanded' ? 0.92 : 0.6")
    expect(detail).toContain('<DialogContent')
    expect(detail).toContain('spot-detail-sheet__body min-h-0 flex-1 overflow-y-auto')
    expect(detail).not.toContain('詳細を見る')
    expect(detail).not.toContain('summary')
    expect(publicPage).toContain('v-if="selectedSpot"')
    expect(publicPage).toContain('v-show="!appModalOpen"')
  })

  it('選択時にmarker DOMを作り直さず重なりPINへclickが移らない', () => {
    const viewer = readFileSync(new URL('../app/composables/useMapViewer.ts', import.meta.url), 'utf8')
    expect(viewer).toContain('watch(() => options.selectedSpotId.value, syncSpotMarkerSelection)')
    expect(viewer).not.toContain('watch(() => options.selectedSpotId.value, syncSpotMarkers)')
  })

  it('モバイルはheaderなしでMapが100dvhを使いCategoryを1行scrollする', () => {
    const category = readFileSync(new URL('../app/components/map/CategoryFilter.vue', import.meta.url), 'utf8')
    expect(publicPage).toContain('hidden h-14')
    expect(publicPage).toContain('h-[100dvh]')
    expect(publicPage).toContain('mobile-cover')
    expect(category).toContain('overflow-x-auto')
    expect(category).toContain('text-sm')
    expect(category).toContain('h-8')
    expect(category).toContain('min-h-11')
    expect(category).not.toContain('overflowCategories')
    expect(mapViewer).toContain(':style="{ height }"')
    expect(mapViewer).toContain('class="h-full w-full transition-opacity duration-150"')
  })

  it('top controls、Map controls、Category、attributionへ独立した配置zoneを持つ', () => {
    expect(publicPage).toContain('max-w-[40vw]')
    expect(publicPage).toContain('bottom-[calc(env(safe-area-inset-bottom)+2rem)]')
    expect(publicPage).toContain('right-[calc(env(safe-area-inset-right)+0.75rem)]')
    expect(mapViewer).toContain('margin-top: calc(env(safe-area-inset-top) + 4.5rem) !important;')
    expect(mapViewer).toContain('.public-map-locked .map-viewer-control-group')
  })

  it('モーダル表示中も操作ヒントをmountしたまま保ちtimerを進める', () => {
    expect(publicPage).toContain('<MapOperationHint :storage-key=')
    expect(publicPage).not.toContain('<MapOperationHint v-if="!appModalOpen"')
  })
})
