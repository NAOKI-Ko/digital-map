import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const publicPage = readFileSync(new URL('../app/pages/[mapSlug]/index.vue', import.meta.url), 'utf8')
const categoryFilter = readFileSync(new URL('../app/components/map/CategoryFilter.vue', import.meta.url), 'utf8')
const mapViewer = readFileSync(new URL('../app/components/map/MapViewer.vue', import.meta.url), 'utf8')
const mapViewerComposable = readFileSync(new URL('../app/composables/useMapViewer.ts', import.meta.url), 'utf8')
const detailCard = readFileSync(new URL('../app/components/map/SpotDetailCard.vue', import.meta.url), 'utf8')

describe('モバイル公開Map UI', () => {
  it('Categoryを下部中央へ置き、選択中sheetとの重なりを避ける', () => {
    expect(publicPage).toContain('left-1/2')
    expect(publicPage).toContain('w-[min(50vw,44rem)]')
    expect(publicPage).toContain('max-sm:w-[calc(100vw-1.5rem)]')
    expect(publicPage).toContain("bottom-[max(1rem,env(safe-area-inset-bottom))]")
    expect(publicPage).toContain("bottom-[calc(8.75rem+env(safe-area-inset-bottom))]")
  })

  it('Category overflowは選択状態を共有しaccessible nameを持つ', () => {
    expect(categoryFilter).toContain('aria-label="その他のカテゴリー"')
    expect(categoryFilter).toContain(':aria-pressed="overflowHasSelection"')
    expect(categoryFilter).toContain("emit('update:modelValue', toggleCategory(category.id, modelValue))")
  })

  it('現在地の常時説明を削除し、エリア外feedbackは維持する', () => {
    expect(mapViewer).not.toContain('現在地はイラスト上のおおよその目安です。')
    expect(mapViewer).toContain('geolocationAreaMessage')
  })

  it('Map controlを右上の横グループへまとめ、44px touch targetにする', () => {
    expect(mapViewerComposable).toContain("instance.addControl(mapControlGroup, 'top-right')")
    expect(mapViewer).toContain('.map-viewer-control-group')
    expect(mapViewer).toContain('width: 2.75rem;')
    expect(mapViewer).toContain('height: 2.75rem;')
  })

  it('Bottom Sheetはcollapsed/expandedを持ちsafe areaへ対応する', () => {
    expect(detailCard).toContain("const expanded = ref(false)")
    expect(detailCard).toContain(':aria-expanded="expanded"')
    expect(detailCard).toContain('env(safe-area-inset-bottom)')
  })

  it('mobile backdropはmap gestureを奪わずsheet本体だけ操作可能にする', () => {
    expect(detailCard).toContain('pointer-events-none fixed inset-0')
    expect(detailCard).toContain('pointer-events-auto w-full')
    expect(detailCard).toContain('sm:pointer-events-auto')
  })
})
