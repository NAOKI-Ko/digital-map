import { describe, expect, it } from 'vitest'
import { normalizePinIconType } from '../shared/constants/spot'
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
})
