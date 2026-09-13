import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const editorSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/editor.vue', import.meta.url), 'utf8')
const detailSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/spots/[spotId].vue', import.meta.url), 'utf8')

describe('Spot位置再設定モード', () => {
  it('詳細画面から配置状態に応じた専用モードへ入る', () => {
    expect(detailSource).toContain("'位置を設定' : '位置を再設定'")
    expect(detailSource).toContain('placeSpotId: data.spot.id')
  })

  it('dragは候補だけを更新し、明示保存までAPIを書かない', () => {
    const candidateFunction = editorSource.slice(
      editorSource.indexOf('function updateCandidateFromDrag'),
      editorSource.indexOf('</script>'),
    )
    expect(candidateFunction).toContain('position.value = { x: value.x, y: value.y }')
    expect(candidateFunction).not.toContain('$fetch')
    expect(editorSource).toContain('この位置を保存')
  })

  it('キャンセルは保存済み位置を候補へ戻し、APIを書かない', () => {
    const cancelFunction = editorSource.slice(
      editorSource.indexOf('function cancelPositionEditing'),
      editorSource.indexOf('async function unplaceSpot'),
    )
    expect(cancelFunction).toContain('{ x: spot.x, y: spot.y }')
    expect(cancelFunction).not.toContain('$fetch')
  })

  it('PIN配置解除には確認ダイアログがある', () => {
    expect(editorSource).toContain('title="PIN配置を解除"')
    expect(editorSource).toContain("method: 'DELETE'")
  })
})
