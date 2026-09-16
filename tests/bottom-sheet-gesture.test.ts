import { describe, expect, it } from 'vitest'
import { getBottomSheetGestureOutcome, isVerticalSheetGesture } from '../app/composables/useBottomSheetGesture'

describe('Spot bottom sheet gesture thresholds', () => {
  it('8px未満と横優位の操作をdragにしない', () => {
    expect(isVerticalSheetGesture(0, 7.9)).toBe(false)
    expect(isVerticalSheetGesture(10, 12)).toBe(false)
    expect(isVerticalSheetGesture(8, 11)).toBe(true)
  })

  it('80pxの下dragはdetail/expandedのどちらからも直接閉じる', () => {
    expect(getBottomSheetGestureOutcome({ source: 'header', state: 'detail', dx: 0, dy: 80, velocityY: 0 })).toBe('close')
    expect(getBottomSheetGestureOutcome({ source: 'body', state: 'expanded', dx: 0, dy: 100, velocityY: 0 })).toBe('close')
  })

  it('24px以上かつ直近速度0.5px/ms以上の下flickを閉じる', () => {
    expect(getBottomSheetGestureOutcome({ source: 'body', state: 'detail', dx: 0, dy: 24, velocityY: 0.5 })).toBe('close')
    expect(getBottomSheetGestureOutcome({ source: 'body', state: 'detail', dx: 0, dy: 24, velocityY: 0.49 })).toBe('reset')
  })

  it('headerの64px上dragだけdetailをexpandedへ移す', () => {
    expect(getBottomSheetGestureOutcome({ source: 'header', state: 'detail', dx: 0, dy: -64, velocityY: 0 })).toBe('expand')
    expect(getBottomSheetGestureOutcome({ source: 'body', state: 'detail', dx: 0, dy: -80, velocityY: 0 })).toBe('reset')
    expect(getBottomSheetGestureOutcome({ source: 'header', state: 'expanded', dx: 0, dy: -80, velocityY: 0 })).toBe('reset')
  })
})
