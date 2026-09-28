import { createHash } from 'node:crypto'
import type { Prisma } from '~~/prisma/generated/client'

export const pinSourceInclude = { include: { pinDefaultAsset: { include: { variants: true } } } } satisfies Prisma.CategoryDefaultArgs

export function assertPinSourceMembership(spot: { pinSourceCategoryId?: string | null }, categoryIds: readonly string[]) {
  if (spot.pinSourceCategoryId && !categoryIds.includes(spot.pinSourceCategoryId)) {
    throw createError({ statusCode: 409, statusMessage: 'PIN用カテゴリーは外せません。先にPINの設定元を別のカテゴリー・標準ピン・個別設定（設定元を解除）へ変更してください。' })
  }
}
export function pinDependentsVersion(spots: Array<{ id: string, liveVersion: number }>) {
  return createHash('sha256').update(JSON.stringify(spots.toSorted((a, b) => a.id.localeCompare(b.id)).map(spot => [spot.id, spot.liveVersion]))).digest('hex')
}
export function pinConflict() { return createError({ statusCode: 409, statusMessage: '設定が変更されています。最新の内容を読み込み、もう一度確認してください。変更は保存されていません。' }) }
