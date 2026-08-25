import { describe, expect, it } from 'vitest'
import { getVisibleCategoryCount } from '../app/utils/category-overflow'

describe('Category overflow', () => {
  it('全Categoryが収まる場合はoverflowへ移さない', () => {
    expect(getVisibleCategoryCount(320, 72, [80, 80], 44, 8)).toBe(2)
  })

  it('収まらないCategoryをoverflowへ残す', () => {
    expect(getVisibleCategoryCount(260, 72, [80, 80, 80], 44, 8)).toBe(1)
  })

  it('狭い場合もすべてボタンとoverflow操作を優先する', () => {
    expect(getVisibleCategoryCount(124, 72, [80], 44, 8)).toBe(0)
  })
})
