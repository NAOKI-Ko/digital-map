import { describe, expect, it } from 'vitest'
import { nextCategoryScrollLeft } from '../app/utils/category-scroll'

describe('category paging recovery', () => {
  it('pages through more than three visible widths, then returns to the first category', () => {
    const scroller = { scrollLeft: 0, clientWidth: 200, scrollWidth: 1050 }
    const positions: number[] = []
    while (scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1) {
      scroller.scrollLeft = nextCategoryScrollLeft(scroller, true)
      positions.push(scroller.scrollLeft)
    }
    expect(positions).toEqual([160, 320, 480, 640, 800, 850])
    scroller.scrollLeft = nextCategoryScrollLeft(scroller, false)
    expect(scroller.scrollLeft).toBe(0)
    expect(nextCategoryScrollLeft(scroller, true)).toBe(160)
  })
})
