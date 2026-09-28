import { describe, expect, it } from 'vitest'
import { fromSelectValue, toSelectValue } from '../app/utils/ui-select-value'

describe('UI select values', () => {
  it('keeps empty filter choices valid for Reka and restores the form value', () => {
    const selectValue = toSelectValue('')
    expect(selectValue).not.toBe('')
    expect(fromSelectValue(selectValue)).toBe('')
  })

  it('preserves ordinary option identifiers', () => {
    expect(toSelectValue('category-1')).toBe('category-1')
    expect(fromSelectValue('category-1')).toBe('category-1')
  })
})
