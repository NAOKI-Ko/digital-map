export interface EntrancePin { element: HTMLElement, id: string, priority: number, centerDistance: number }
export const PIN_ENTRANCE_DURATION = 200
export const PIN_ENTRANCE_DELAY = 24
export const PIN_ENTRANCE_MAX_DELAY = 240

/** Center-out waves, with protected/category/featured priority within each wave.
 * At most eleven waves: a dense floor is ready within 440ms, regardless of count. */
export function planPinEntrance(pins: readonly EntrancePin[]) {
  const sorted = [...pins].sort((a, b) => a.centerDistance - b.centerDistance || a.id.localeCompare(b.id))
  const waveSize = Math.max(1, Math.ceil(sorted.length / 11))
  return sorted.map((pin, index) => ({ ...pin, delay: Math.min(PIN_ENTRANCE_MAX_DELAY, Math.floor(index / waveSize) * PIN_ENTRANCE_DELAY) }))
    .sort((a, b) => a.delay - b.delay || b.priority - a.priority || a.centerDistance - b.centerDistance)
}

/** One entrance per initial/floor presentation, never per marker rebuild/filter.
 * Originals stay in layout for geometry/hit testing. Only an inert paint copy moves. */
export function createPinEntrance() {
  let floorId: string | null = null
  let pending = false
  let elements: HTMLElement[] = []
  const running = new Set<() => void>()
  function finish() {
    running.forEach(stop => stop())
    elements.forEach(element => element.classList.remove('map-viewer-marker--awaiting'))
    pending = false
  }
  function prepare(id: string, next: HTMLElement[]) {
    running.forEach(stop => stop())
    elements.forEach(element => element.classList.remove('map-viewer-marker--awaiting'))
    if (floorId !== id) { floorId = id; pending = true }
    elements = next
    if (pending) elements.forEach(element => element.classList.add('map-viewer-marker--awaiting'))
  }
  function play(pins: readonly EntrancePin[], reduced: boolean) {
    if (!pending) return
    pending = false
    elements.forEach(element => element.classList.remove('map-viewer-marker--awaiting'))
    if (reduced) return
    for (const { element, delay } of planPinEntrance(pins)) {
      if (element.contains(element.ownerDocument.activeElement)) continue
      const paint = element.ownerDocument.createElement('span')
      paint.className = 'map-viewer-marker__entrance'
      paint.setAttribute('aria-hidden', 'true')
      paint.inert = true
      for (const child of [...element.children]) paint.append(child.cloneNode(true))
      element.append(paint)
      element.classList.add('map-viewer-marker--entering')
      const cleanup = () => {
        paint.remove()
        element.classList.remove('map-viewer-marker--entering')
        element.removeEventListener('pointerdown', cleanup)
        element.removeEventListener('focusin', cleanup)
        running.delete(cleanup)
      }
      running.add(cleanup)
      element.addEventListener('pointerdown', cleanup, { once: true })
      element.addEventListener('focusin', cleanup, { once: true })
      const animation = paint.animate([
        { opacity: 0, transform: 'translateY(5px) scale(.7)', offset: 0 },
        { opacity: 1, transform: 'translateY(0) scale(1.06)', offset: .7 },
        { opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 },
      ], { duration: PIN_ENTRANCE_DURATION, delay, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' })
      animation.onfinish = cleanup
      animation.oncancel = cleanup
    }
  }
  return { prepare, play, finish }
}
