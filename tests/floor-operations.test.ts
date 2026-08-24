import { describe, expect, it } from 'vitest'
import { floorUpdateSchema } from '../shared/schemas/floor'

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
})
