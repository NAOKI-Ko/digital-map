import { describe, expect, it } from 'vitest'
import {
  defaultPinIconId,
  getPinIconPreset,
  normalizePinIconId,
  normalizePinIconType,
} from '../shared/constants/spot'
import { pinDesignSchema } from '../shared/schemas/pin-design'

const baseDesign = {
  pinIconId: 'food' as const,
  pinIconImageUrl: null,
  pinColor: '#C7401F',
}

describe('ピン表示方式の保存値', () => {
  it.each(['preset', 'custom', 'illustration'] as const)('%sを受け付ける', (pinIconType) => {
    const result = pinDesignSchema.safeParse({
      ...baseDesign,
      pinIconType,
      pinIconImageUrl: pinIconType === 'preset' ? null : '/uploads/12345678-1234-4123-8123-123456789abc.png',
    })

    expect(result.success).toBe(true)
  })

  it('イラスト直置きは画像URLを必須にする', () => {
    const result = pinDesignSchema.safeParse({
      ...baseDesign,
      pinIconType: 'illustration',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('直置きするイラスト画像をアップロードしてください。')
  })

  it('既存のcustom値を変更せず、不明値だけpresetへ安全に戻す', () => {
    expect(normalizePinIconType('custom')).toBe('custom')
    expect(normalizePinIconType('illustration')).toBe('illustration')
    expect(normalizePinIconType('unknown')).toBe('preset')
  })

  it.each([
    ['kanji:食', 'kanji', '食'],
    ['material:restaurant', 'material', 'restaurant'],
    ['food', 'kanji', '食'],
    ['食', 'kanji', '食'],
  ] as const)('%sのファミリーと表示値を解決する', (id, family, symbol) => {
    expect(getPinIconPreset(id)).toMatchObject({ family, symbol })
  })

  it('接頭辞なしの既存IDをcanonicalなkanji IDへ正規化する', () => {
    expect(normalizePinIconId('hot-spring')).toBe('kanji:♨')
    expect(normalizePinIconId('♨')).toBe('kanji:♨')
  })

  it('カテゴリ既定値は引き続き文字アイコンを使う', () => {
    expect(defaultPinIconId('飲食')).toBe('kanji:食')
    expect(defaultPinIconId('その他')).toBe('kanji:●')
  })

  it.each(['kanji:食', 'material:restaurant', 'food'])('%sを保存値として受け付ける', (pinIconId) => {
    const result = pinDesignSchema.safeParse({
      ...baseDesign,
      pinIconType: 'preset',
      pinIconId,
    })

    expect(result.success).toBe(true)
  })

  it('一覧にないMaterial Symbols名は保存できない', () => {
    const result = pinDesignSchema.safeParse({
      ...baseDesign,
      pinIconType: 'preset',
      pinIconId: 'material:not_in_the_subset',
    })

    expect(result.success).toBe(false)
  })
})
