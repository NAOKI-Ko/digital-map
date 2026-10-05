// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinEntrance, planPinEntrance, PIN_ENTRANCE_DURATION } from '../app/utils/marker-entrance'
import { measurePinVisualRect } from '../app/utils/marker-collision'
function pin(id: string, distance = 0, priority = 1) {
  const element = document.createElement('button')
  element.className = 'map-viewer-marker'
  const shape = document.createElement('span')
  shape.className = 'map-viewer-marker__shape'
  shape.getBoundingClientRect = () => ({ left: 10, top: 20, right: 50, bottom: 60, width: 40, height: 40 } as DOMRect)
  element.append(shape)
  return { element, id, centerDistance: distance, priority }
}
afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren() })
describe('visitor floor entrance', () => {
  it('orders center-out, bounded to 440ms even for a dense floor', () => {
    const pins = Array.from({ length: 200 }, (_, i) => pin(String(i), 200 - i))
    const plan = planPinEntrance(pins)
    expect(plan[0]!.id).toBe('199')
    expect(Math.max(...plan.map(p => p.delay)) + PIN_ENTRANCE_DURATION).toBeLessThanOrEqual(440)
    expect(new Set(plan.map(p => p.delay)).size).toBeLessThanOrEqual(11)
    expect(plan.slice(0, 19).every(p => p.delay === 0)).toBe(true)
  })
  it('gives priority order within a wave without changing the original data', () => {
    const pins = Array.from({ length: 12 }, (_, i) => pin(String(i), i, i === 1 ? 4 : 1))
    expect(planPinEntrance(pins)[0]!.id).toBe('1')
    expect(pins[0]!.id).toBe('0')
  })
  it.each([false, true])('animates only inert paint copies; collision geometry stays at final bounds (facility %s)', (facility) => {
    const animate = vi.spyOn(Element.prototype, 'animate').mockReturnValue({ onfinish: null, oncancel: null } as Animation)
    const entrance = createPinEntrance(), a = pin('a')
    a.element.classList.toggle('map-viewer-marker--facility', facility)
    const before = measurePinVisualRect(a.element)
    entrance.prepare('floor-a', [a.element]); entrance.play([a], false)
    expect(animate).toHaveBeenCalledTimes(1)
    expect(a.element.querySelector('.map-viewer-marker__entrance')?.getAttribute('aria-hidden')).toBe('true')
    expect(a.element.classList.contains('map-viewer-marker--facility')).toBe(facility)
    expect(a.element.querySelector('.map-viewer-marker__entrance .map-viewer-marker__shape')).not.toBeNull()
    expect(measurePinVisualRect(a.element)).toEqual(before)
    a.element.dispatchEvent(new Event('pointerdown'))
    expect(a.element.querySelector('.map-viewer-marker__entrance')).toBeNull()
    expect(measurePinVisualRect(a.element)).toEqual(before)
  })
  it('does not replay for pan/zoom, representative changes or category rebuilds; replays on floor return', () => {
    const animate = vi.spyOn(Element.prototype, 'animate').mockReturnValue({ onfinish: null, oncancel: null } as Animation)
    const entrance = createPinEntrance(), a = pin('a'), b = pin('b')
    entrance.prepare('1', [a.element]); entrance.play([a], false)
    entrance.play([b], false)
    entrance.prepare('1', [b.element]); entrance.play([b], false)
    expect(animate).toHaveBeenCalledTimes(1)
    entrance.prepare('2', [b.element]); entrance.play([b], false)
    entrance.prepare('1', [a.element]); entrance.play([a], false)
    expect(animate).toHaveBeenCalledTimes(3)
  })
  it('reduced motion and user interruption display originals immediately without later replay', () => {
    const animate = vi.spyOn(Element.prototype, 'animate')
    const entrance = createPinEntrance(), a = pin('a')
    entrance.prepare('1', [a.element]); entrance.play([a], true)
    expect(animate).not.toHaveBeenCalled()
    expect(a.element.classList.contains('map-viewer-marker--awaiting')).toBe(false)
    entrance.prepare('2', [a.element]); entrance.finish(); entrance.play([a], false)
    expect(animate).not.toHaveBeenCalled()
  })
  it('focused PINs remain immediately visible and interactive', () => {
    const animate = vi.spyOn(Element.prototype, 'animate')
    const entrance = createPinEntrance(), a = pin('a')
    document.body.append(a.element); a.element.focus()
    entrance.prepare('1', [a.element]); entrance.play([a], false)
    expect(animate).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(a.element)
  })
})
