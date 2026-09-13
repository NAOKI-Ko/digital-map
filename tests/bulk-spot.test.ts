import { describe, expect, it } from 'vitest'
import { spotBulkSchema } from '../shared/schemas/spot-bulk'

describe('Spot一括操作validation', () => {
  it.each(['delete', 'publish', 'unpublish'] as const)('%sを受け付ける', (action) => {
    expect(spotBulkSchema.safeParse({ action, spotIds: ['spot-1'] }).success).toBe(true)
  })

  it.each(['addCategory', 'removeCategory'] as const)('%sはCategoryを1件だけ受け付ける', (action) => {
    expect(spotBulkSchema.safeParse({ action, spotIds: ['spot-1'], categoryId: 'category-1' }).success).toBe(true)
    expect(spotBulkSchema.safeParse({ action, spotIds: ['spot-1'], categoryIds: [] }).success).toBe(false)
  })

  it('対象Spotなしを拒否する', () => {
    expect(spotBulkSchema.safeParse({ action: 'delete', spotIds: [] }).success).toBe(false)
  })

  it('一括操作は100件まで許可し、101件を拒否する', () => {
    expect(spotBulkSchema.safeParse({ action: 'delete', spotIds: Array.from({ length: 100 }, (_, index) => `spot-${index}`) }).success).toBe(true)
    expect(spotBulkSchema.safeParse({ action: 'delete', spotIds: Array.from({ length: 101 }, (_, index) => `spot-${index}`) }).success).toBe(false)
  })
})
