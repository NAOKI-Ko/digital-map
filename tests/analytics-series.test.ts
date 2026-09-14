import { describe, expect, it } from 'vitest'
import { analyticsSeries } from '../app/utils/analytics-series'

describe('UTC daily chart calendar spacing', () => {
  it('retains zero-view days across month and leap-day boundaries', () => {
    expect(analyticsSeries('2024-02-28', '2024-03-01', [{ date: '2024-03-01', viewCount: 8 }])).toEqual([
      { date: '2024-02-28', viewCount: 0 }, { date: '2024-02-29', viewCount: 0 }, { date: '2024-03-01', viewCount: 8 },
    ])
  })
  it('shows a single selected day without including out-of-range records', () => {
    expect(analyticsSeries('2026-09-15', '2026-09-15', [{ date: '2026-09-14', viewCount: 5 }])).toEqual([{ date: '2026-09-15', viewCount: 0 }])
  })
  it('does not allocate series for invalid, reversed or unsupported date ranges', () => {
    for (const [start, end] of [['', '2026-09-15'], ['2026-09-16', '2026-09-15'], ['2020-01-01', '2026-09-15']]) {
      expect(analyticsSeries(start!, end!, [])).toEqual([])
    }
  })
})
