import { describe, expect, it } from 'vitest'
import { journeyStatus } from '../shared/utils/journey-status'
import { authReturnPath } from '../shared/utils/auth-return'

describe('WU74 saved-data journey guidance', () => {
  it('distinguishes unplaced, placed target off, and optional photos independently', () => {
    expect(journeyStatus([
      { hasPositionedPlacement: false, isPublished: true, photoCount: 0 },
      { hasPositionedPlacement: true, isPublished: false, photoCount: 1 },
      { hasPositionedPlacement: true, isPublished: true, photoCount: 0 },
    ])).toEqual({ total: 3, unplaced: 1, targetOff: 1, candidates: 1, withoutPhoto: 2 })
  })
  it('does not infer placement from legacy coordinates or declare empty work complete', () => {
    expect(journeyStatus([])).toEqual({ total: 0, unplaced: 0, targetOff: 0, candidates: 0, withoutPhoto: 0 })
    expect(journeyStatus([{ isPublished: true, photoCount: 1 }]).candidates).toBe(0)
  })
})

describe('WU74 safe return from existing invitation login', () => {
  it.each(['/admin/maps/a/spots?filter=unplaced', '/admin/signup/complete?intent=a', '/invite/accept?token=qa-token'])('preserves %s', value => expect(authReturnPath(value)).toBe(value))
  it.each(['https://evil.invalid', '//evil.invalid', '/admin/login?redirect=/admin/login', '/admin/login/', '/admin/../signup', '/invite/accept', '/invite/other?token=a', '/admin/%2f%2fevil.invalid', '/admin/%5cevil.invalid', '/admin/%', '/admin/maps/a\n'])('rejects %s', value => expect(authReturnPath(value)).toBe('/admin/dashboard'))
})
