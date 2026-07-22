import { describe, expect, it } from 'vitest'
import { buildPublicMapUrl } from '../shared/utils/public-url'

describe('公開URL生成', () => {
  it('現在のorigin直下へマップslugを配置する', () => {
    expect(buildPublicMapUrl('https://maps.example.jp', 'satoyama-resort')).toBe(
      'https://maps.example.jp/satoyama-resort',
    )
  })

  it('slugをURLとして安全にエンコードする', () => {
    expect(buildPublicMapUrl('https://maps.example.jp/', 'sample map')).toBe(
      'https://maps.example.jp/sample%20map',
    )
  })
})
