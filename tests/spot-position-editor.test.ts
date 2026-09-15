import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const editorSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/editor.vue', import.meta.url), 'utf8')
const detailSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/spots/[spotId]/index.vue', import.meta.url), 'utf8')

describe('PIN管理workspace', () => {
  it('Spot詳細はread-only summaryからPIN管理へ導き、編集UIを重複させない', () => {
    expect(detailSource).toContain('PIN配置画面で編集')
    expect(detailSource).toContain('placeSpotId: data.spot.id')
    expect(detailSource).not.toContain('<PinDesignEditor')
    expect(detailSource).not.toContain('位置を再設定')
  })

  it('dragは候補だけを更新し、明示保存までAPIを書かない', () => {
    const candidateFunction = editorSource.slice(
      editorSource.indexOf('function updateCandidateFromDrag'),
      editorSource.indexOf('</script>'),
    )
    expect(candidateFunction).toContain('position.value = { x: value.x, y: value.y }')
    expect(candidateFunction).not.toContain('$fetch')
    expect(editorSource).toContain('この位置を保存')
    expect(candidateFunction).not.toContain('/design')
  })

  it('キャンセルはcandidateを破棄し、APIを書かない', () => {
    const cancelFunction = editorSource.slice(
      editorSource.indexOf('function cancelPositionEditing'),
      editorSource.indexOf('async function unplaceSpot'),
    )
    expect(cancelFunction).toContain("placementMode.value = 'idle'")
    expect(cancelFunction).toContain('position.value = null')
    expect(cancelFunction).not.toContain('$fetch')
  })

  it('PIN配置解除には確認ダイアログがある', () => {
    expect(editorSource).toContain('title="PIN配置を解除"')
    expect(editorSource).toContain("method: 'DELETE'")
  })

  it('既存PINを地図から直接選択し、旧一覧とraw座標を表示しない', () => {
    expect(editorSource).toContain('@spot-selected="selectExistingSpot"')
    expect(editorSource).toContain('選択中のスポット')
    expect(editorSource).toContain("'位置を移動' : '位置を設定'")
    expect(editorSource).toContain('>デザインを編集</button>')
    expect(editorSource).toContain('>配置を解除</button>')
    expect(editorSource).not.toContain('<h2 class="font-bold text-stone-900">既存スポット</h2>')
    expect(editorSource).not.toContain('toFixed(4)')
    expect(editorSource).not.toContain('toFixed(7)')
  })

  it('未配置Spotだけを検索Comboboxから明示配置modeへ入れる', () => {
    expect(editorSource).toContain('unpositionedFloorSpots')
    expect(editorSource).toContain('<SpotCombobox')
    expect(editorSource).toContain('位置を設定')
    expect(editorSource).toContain(':placement-enabled="placementActive"')
  })

  it('PIN design controlsをeditorへ集約する', () => {
    expect(editorSource).toContain('<PinDesignEditor')
    expect(editorSource).toContain('PINデザイン')
    expect(editorSource).toContain(':show-save="false"')
    expect(editorSource).toContain('@changed="handlePinDesignChanged"')
    expect(editorSource).not.toContain('<details')
  })

  it('配置済みSpot検索はfocusだけを行い移動modeへ入らない', () => {
    expect(editorSource).toContain('label="配置済みSpotを検索"')
    expect(editorSource).toContain('mapViewerRef.value?.focusSpot(spotId)')
    const selectionFunction = editorSource.slice(
      editorSource.indexOf('function selectPositionedSpot'),
      editorSource.indexOf('function handlePinDesignChanged'),
    )
    expect(selectionFunction).not.toContain('startMoving')
  })

  it('PIN workspaceにジオリファレンスCTAや実地図導線を出さない', () => {
    expect(editorSource).not.toContain('ジオリファレンスを設定')
    expect(editorSource).not.toContain('geoReferenceEditorPath')
  })

  it('移動元ghostと実デザイン候補をMapViewerへ渡す', () => {
    expect(editorSource).toContain(':candidate-spot="candidateSpot"')
    expect(editorSource).toContain(':candidate-kind="candidateKind"')
    expect(editorSource).toContain("placementMode.value === 'moving' ? 'move'")
  })
})
