import { describe, expect, it } from 'vitest'
import { spotBulkSchema } from '../shared/schemas/spot-bulk'

describe('Spot一括操作validation', () => {
  it.each(['delete', 'publish', 'unpublish'] as const)('%sを受け付ける', (action) => {
    expect(spotBulkSchema.safeParse({ action, spotIds: ['spot-1'] }).success).toBe(true)
  })

  it('Category 0件を含む一括置換を受け付ける', () => {
    expect(spotBulkSchema.safeParse({ action: 'setCategories', spotIds: ['spot-1'], categoryIds: [] }).success).toBe(true)
  })

  it('対象Spotなしを拒否する', () => {
    expect(spotBulkSchema.safeParse({ action: 'delete', spotIds: [] }).success).toBe(false)
  })
})
