import { describe, expect, it } from 'vitest'
import { placementQueue } from '../app/utils/placement-queue'
const spots = [{ id: 'b', name: '展示02', floorId: '1', x: null, y: null }, { id: 'a', name: '展示01', floorId: '1', x: null, y: null }, { id: 'c', name: '展示03', floorId: '2', x: null, y: null }]
describe('floor placement queue', () => {
  it('reconstructs a stable name/id order independent of last edit order', () => {
    expect(placementQueue(spots, '1').map(s => s.id)).toEqual(['a', 'b'])
    expect(placementQueue([...spots].reverse(), '1').map(s => s.id)).toEqual(['a', 'b'])
  })
  it('excludes saved/concurrently placed items but retains partial and skipped records for later', () => {
    expect(placementQueue(spots, '1', ['a']).map(s => s.id)).toEqual(['b'])
    expect(placementQueue(spots, '1').length).toBe(2)
    expect(placementQueue([{ ...spots[0]!, x: 0, y: 0 }], '1')).toEqual([])
    expect(placementQueue([{ ...spots[0]!, x: 0 }], '1')).toHaveLength(1)
    expect(placementQueue(spots, 'unknown')).toEqual([])
  })
})
