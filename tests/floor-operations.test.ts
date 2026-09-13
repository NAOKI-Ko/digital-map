import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { floorUpdateSchema } from '../shared/schemas/floor'

const uploaderSource = readFileSync(new URL('../app/components/admin/ImageUploader.vue', import.meta.url), 'utf8')
const floorPageSource = readFileSync(new URL('../app/pages/admin/maps/[mapId]/floors.vue', import.meta.url), 'utf8')

describe('フロア画像差し替え', () => {
  it('名称だけの更新を引き続き許可する', () => {
    expect(floorUpdateSchema.safeParse({ name: '1F' }).success).toBe(true)
  })

  it('画像URLと寸法を一組で受け付ける', () => {
    expect(floorUpdateSchema.safeParse({
      name: '1F',
      illustrationUrl: '/uploads/12345678-1234-4123-8123-123456789abc.png',
      imageWidth: 1200,
      imageHeight: 800,
    }).success).toBe(true)
  })

  it('画像情報の部分指定を拒否する', () => {
    expect(floorUpdateSchema.safeParse({ name: '1F', imageWidth: 1200 }).success).toBe(false)
  })

  it('差し替え入力にSpot位置やジオリファレンス値を混在させない', () => {
    const result = floorUpdateSchema.parse({
      name: '1F',
      illustrationUrl: '/uploads/12345678-1234-4123-8123-123456789abc.png',
      imageWidth: 2400,
      imageHeight: 900,
      x: 0.9,
      refAImageX: 0.8,
    })
    expect(result).toEqual({
      name: '1F',
      illustrationUrl: '/uploads/12345678-1234-4123-8123-123456789abc.png',
      imageWidth: 2400,
      imageHeight: 900,
    })
  })

  it('選択後はプレビューを主表示にし、明示的な選び直し操作を出す', () => {
    expect(uploaderSource).toContain('v-if="!selectedFile"')
    expect(uploaderSource).toContain('画像を選び直す')
  })

  it('フロア作成成功後に画像選択とプレビューをリセットする', () => {
    expect(uploaderSource).toContain('defineExpose({ reset })')
    expect(floorPageSource).toContain('createPickerRevision.value += 1')
  })

  it('画像比率が変わっても相対位置を自動補正しないと警告する', () => {
    expect(floorPageSource).toContain('画像内容や比率が変わっても自動補正されません')
    expect(floorPageSource).not.toContain('既存PINの緯度経度')
  })
})
