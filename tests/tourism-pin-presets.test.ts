import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getPinIconPreset, isSupportedPinIconId } from '../shared/constants/spot'
import { materialSymbolPresets } from '../shared/constants/icon-presets'

describe('観光向けPINプリセット', () => {
  it('主要な観光semantic groupを網羅する', () => {
    const labels = materialSymbolPresets.map(item => item.label)
    for (const label of ['寺社', '博物館', '公園', '写真スポット', '駅', 'バス', '駐車場', 'トイレ', '飲食', 'カフェ', '買い物', '宿泊', '案内所', '救護・医療', 'Wi-Fi']) expect(labels).toContain(label)
  })
  it('既存preset IDをすべて維持する', () => {
    for (const id of ['restaurant', 'local_cafe', 'icecream', 'hotel', 'bed', 'hot_tub', 'storefront', 'shopping_bag', 'museum', 'church', 'castle', 'park', 'forest', 'local_florist', 'beach_access', 'wc', 'local_parking', 'local_atm', 'festival', 'photo_camera', 'directions_walk']) expect(isSupportedPinIconId(`material:${id}`)).toBe(true)
  })
  it('未知glyphは既存fallback PINへ正規化される', () => {
    expect(getPinIconPreset('material:missing').id).toBe('kanji:●')
  })
  it('pickerは同じMaterial preset catalogをgroup表示しCustom PINを維持する', () => {
    const source = readFileSync(new URL('../app/components/admin/PinDesignEditor.vue', import.meta.url), 'utf8')
    expect(source).toContain('materialPresetGroups')
    expect(source).toContain("value: 'custom'")
  })
})
