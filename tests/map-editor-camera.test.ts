import { describe, expect, it } from 'vitest'
import { createMapEditorReturnQuery, parseMapEditorReturnContext, resolveMapEditorReturnContext } from '../app/utils/map-editor-camera'

const context = {
  floorId: 'floor-b',
  center: { lat: 35.1, lng: 139.2 },
  zoom: 16.5,
}

describe('PIN配置editorの一時camera context', () => {
  it('floor/center/zoomを登録画面との往復queryへ直列化する', () => {
    expect(createMapEditorReturnQuery(context)).toEqual({
      floorId: 'floor-b',
      cameraLat: '35.1',
      cameraLng: '139.2',
      cameraZoom: '16.5',
    })
  })

  it('有効な往復queryだけをcamera contextへ復元する', () => {
    expect(parseMapEditorReturnContext(createMapEditorReturnQuery(context))).toEqual(context)
  })

  it('往復元のfloorが存在する場合だけcamera contextを採用する', () => {
    const query = createMapEditorReturnQuery(context)
    expect(resolveMapEditorReturnContext(query, ['floor-a', 'floor-b'])).toEqual(context)
    expect(resolveMapEditorReturnContext(query, ['floor-a'])).toBeNull()
  })

  it.each([
    {},
    { floorId: 'floor-b' },
    { ...createMapEditorReturnQuery(context), cameraLat: 'NaN' },
    { ...createMapEditorReturnQuery(context), cameraLng: '181' },
    { ...createMapEditorReturnQuery(context), cameraZoom: '25' },
  ])('direct openや不正なqueryでは復元しない', (query) => {
    expect(parseMapEditorReturnContext(query)).toBeNull()
  })
})
