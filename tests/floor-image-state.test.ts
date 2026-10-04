import { describe, expect, it } from 'vitest'
import { monitorFloorImage, type FloorImageState } from '../app/utils/floor-image-state'
function source() {
  const handlers = new Map<string, () => void>()
  return { on: (type: string, handler: () => void) => handlers.set(type, handler), emit: (type: string) => handlers.get(type)?.() }
}
describe('visitor floor image feedback', () => {
  it('keeps a failed image in error until a new request and ignores stale same-floor events', () => {
    const first = source(), retry = source(), states: FloorImageState[] = []
    let current = first
    monitorFloorImage(first, () => current === first, state => states.push(state))
    first.emit('error'); first.emit('data')
    expect(states).toEqual(['loading','error'])
    current = retry
    monitorFloorImage(retry, () => current === retry, state => states.push(state))
    first.emit('error'); first.emit('data'); retry.emit('data')
    expect(states).toEqual(['loading','error','loading','loaded'])
  })
  it('floor switch discards a late failure instead of covering the new floor', () => {
    const old = source(), states: FloorImageState[] = []
    let active = true
    monitorFloorImage(old, () => active, state => states.push(state))
    active = false; old.emit('error'); old.emit('data')
    expect(states).toEqual(['loading'])
  })
})
