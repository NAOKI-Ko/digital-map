import { describe, expect, it } from 'vitest'
import { createLatestRequestGate } from '../app/utils/latest-request'

describe('latest async request gate', () => {
  it('accepts only the latest request and invalidates work when context changes', () => {
    const gate = createLatestRequestGate()
    const first = gate.begin()
    const second = gate.begin()

    expect(gate.isCurrent(first)).toBe(false)
    expect(gate.isCurrent(second)).toBe(true)

    gate.invalidate()
    expect(gate.isCurrent(second)).toBe(false)
  })
})
