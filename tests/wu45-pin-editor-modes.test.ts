import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { applySelectedPinDesignDraft, isPositionEditing, needsPinEditorDiscardConfirmation, toPositionUpdatePayload } from '../app/utils/pin-editor-state'
import type { MapViewerSpot } from '../shared/types/map-viewer'

const editorSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/editor.vue', import.meta.url), 'utf8')
const designSource = readFileSync(new URL('../app/components/admin/PinDesignEditor.vue', import.meta.url), 'utf8')

const spots: MapViewerSpot[] = [
  { id: 'a', name: 'A', categories: [], importance: 'normal', x: 0.2, y: 0.3, pinIconType: 'preset', pinIconId: 'sightseeing', pinIconImageUrl: null, pinColor: '#C7401F', pinSize: 'medium' },
  { id: 'b', name: 'B', categories: [], importance: 'normal', x: 0.7, y: 0.8, pinIconType: 'preset', pinIconId: 'food', pinIconImageUrl: null, pinColor: '#2563EB', pinSize: 'small' },
]

describe('WU-45 PIN editor modes', () => {
  it('位置モードとデザインモードは排他的', () => {
    expect(isPositionEditing('placing')).toBe(true)
    expect(isPositionEditing('moving')).toBe(true)
    expect(isPositionEditing('designing')).toBe(false)
    expect(editorSource).toContain("const designEditing = computed(() => placementMode.value === 'designing')")
    expect(editorSource).toContain('v-else-if="designEditing"')
  })

  it('未保存デザインは対象PINだけへ合成し、保存済み配列を変更しない', () => {
    const draft = { pinIconType: 'illustration' as const, pinIconId: null, pinIconImageUrl: '/uploads/draft.png', pinIconAssetId: 'asset-1', pinColor: '#047857', pinSize: 'large' as const, importance: 'featured' as const }
    const rendered = applySelectedPinDesignDraft(spots, 'a', 'designing', draft)

    expect(rendered[0]).toMatchObject(draft)
    expect(rendered[1]).toEqual(spots[1])
    expect(spots[0]?.pinIconType).toBe('preset')
    expect(applySelectedPinDesignDraft(spots, 'a', 'moving', draft)).toBe(spots)
  })

  it('位置payloadには座標だけを含める', () => {
    expect(toPositionUpdatePayload({ x: 0.42, y: 0.61 })).toEqual({ x: 0.42, y: 0.61 })
    const savePosition = editorSource.slice(editorSource.indexOf('async function savePosition'), editorSource.indexOf('async function saveDesign'))
    expect(savePosition).toContain('/position')
    expect(savePosition).not.toContain('/design')
    expect(savePosition).not.toContain('pinDesignEditorRef.value?.save')
  })

  it('デザイン保存はデザインAPIだけを呼び、失敗時に終了処理へ進まない', () => {
    const saveDesign = editorSource.slice(editorSource.indexOf('async function saveDesign'), editorSource.indexOf('function cancelPositionEditing'))
    expect(saveDesign).toContain('pinDesignEditorRef.value?.save()')
    expect(saveDesign).not.toContain('/position')
    expect(saveDesign).toMatch(/if \(!savedDesign\)[\s\S]*?return[\s\S]*?finishSuccessfulSave/)
  })

  it('保存成功は再取得後に選択・mode・draftをリセットする', () => {
    const finish = editorSource.slice(editorSource.indexOf('async function finishSuccessfulSave'), editorSource.indexOf('async function savePosition'))
    expect(finish.indexOf('await refreshSpots()')).toBeLessThan(finish.indexOf("placementMode.value = 'idle'"))
    expect(finish).toContain("placementSpotId.value = ''")
    expect(finish).toContain('pendingPinDesign.value = null')
    expect(finish).toContain("query: { floorId: selectedFloorId.value }")
  })

  it('candidateまたはデザインdraftを捨てる切替だけ確認対象にする', () => {
    expect(needsPinEditorDiscardConfirmation('moving', { x: 0.1, y: 0.2 }, false)).toBe(true)
    expect(needsPinEditorDiscardConfirmation('designing', null, true)).toBe(true)
    expect(needsPinEditorDiscardConfirmation('moving', null, false)).toBe(false)
    expect(needsPinEditorDiscardConfirmation('idle', null, true)).toBe(false)
    expect(editorSource).toContain('title="未保存の変更があります"')
  })

  it('検索とFloorはMap直上、desktopはcanvas優先、狭幅は縦積み', () => {
    expect(editorSource.indexOf('input-id="positioned-spot-search"')).toBeLessThan(editorSource.indexOf('フロア選択'))
    expect(editorSource.indexOf('data-pin-editor-toolbar')).toBeLessThan(editorSource.indexOf('data-pin-editor-workspace'))
    expect(editorSource).toContain('lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]')
    expect(editorSource).toContain('xl:grid-cols-[minmax(0,7fr)_minmax(380px,3fr)]')
    expect(editorSource).toContain('<UiInspector')
    expect(editorSource).toContain('sm:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)]')
    expect(editorSource).toContain('<section class="min-w-0 lg:sticky lg:top-6 lg:self-start" aria-label="地図操作">')
    expect(editorSource).toContain('<UiSelect')
    expect(editorSource).not.toContain('role="tablist" aria-label="編集フロア"')
  })

  it('表示形式ラベル、説明撤去、コンパクトなaccessible presetを保つ', () => {
    expect(designSource).toContain("{ value: 'preset', label: 'プリセット' }")
    expect(designSource).toContain("{ value: 'custom', label: 'カスタム' }")
    expect(designSource).toContain("{ value: 'illustration', label: 'イラスト' }")
    expect(designSource).not.toContain('option.description')
    expect(designSource).not.toContain('{{ preset.label }}')
    expect(designSource).toContain(':aria-label="preset.label"')
    expect(designSource).toContain('h-8 w-8')
    expect(designSource).not.toContain('pin-design-preview')
  })
})
