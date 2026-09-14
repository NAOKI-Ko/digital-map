import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { floorCreateSchema } from '../shared/schemas/floor'
import { pinDesignSchema } from '../shared/schemas/pin-design'

const combobox = readFileSync(new URL('../app/components/admin/SpotCombobox.vue', import.meta.url), 'utf8')
const spotForm = readFileSync(new URL('../app/components/admin/SpotForm.vue', import.meta.url), 'utf8')
const pinDesign = readFileSync(new URL('../app/components/admin/PinDesignEditor.vue', import.meta.url), 'utf8')

describe('WU-42 Human UAT regression', () => {
  it('MediaAssetの最適化済みwebpをFloor作成で受け付ける', () => {
    expect(floorCreateSchema.safeParse({
      name: '2F',
      illustrationUrl: '/uploads/asset-id-floor-variant.webp',
      illustrationAssetId: 'asset-id',
      imageWidth: 1600,
      imageHeight: 900,
    }).success).toBe(true)
  })

  it('MediaAssetの最適化済みwebpをカスタムPINで受け付ける', () => {
    expect(pinDesignSchema.safeParse({
      pinIconType: 'illustration',
      pinIconId: null,
      pinIconImageUrl: '/uploads/asset-id-pin-variant.webp',
      pinIconAssetId: 'asset-id',
      pinColor: '#C7401F',
      pinSize: 'small',
      importance: 'featured',
    }).success).toBe(true)
  })

  it('最適化形式を許可してもuploads外へのpathは受け付けない', () => {
    expect(pinDesignSchema.safeParse({
      pinIconType: 'illustration',
      pinIconId: null,
      pinIconImageUrl: '/uploads/../private.webp',
      pinColor: '#C7401F',
      pinSize: 'medium',
    }).success).toBe(false)
  })

  it('未配置Spot Comboboxはkeyboard/listbox contractを持つ', () => {
    expect(combobox).toContain('role="combobox"')
    expect(combobox).toContain('role="listbox"')
    expect(combobox).toContain("event.key === 'ArrowDown'")
    expect(combobox).toContain("event.key === 'Enter'")
    expect(combobox).toContain("event.key === 'Escape'")
    expect(combobox).toContain('spot.id')
  })

  it('Spot内容formからPIN visual controlsを除き、PIN editorに重要度を置く', () => {
    expect(spotForm).not.toContain('id="spot-importance"')
    expect(pinDesign).toContain('表示優先度')
    expect(pinDesign).toContain('design.importance')
  })
})
