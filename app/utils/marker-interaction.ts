import { measurePinVisualRect, type ScreenRect } from './marker-collision'

const actions = new WeakMap<HTMLElement, () => void>()
const contains = (r: ScreenRect, x: number, y: number) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom

/** When transparent targets overlap, painted artwork wins over a neighbor's padding.
 * Otherwise retain native target/priority behavior and the full 60px touch target.
 */
export function artworkTarget(origin: HTMLElement, x: number, y: number): HTMLElement {
  const scope = origin.parentElement
  if (!scope) return origin
  const pins = Array.from(scope.children).filter((node): node is HTMLElement =>
    node instanceof HTMLElement && node.classList.contains('map-viewer-marker') && node.dataset.pinVisible === 'true')
  // Badges and artwork share their button's stacking context. Resolve them
  // together so an obscured badge never steals a foreground artwork tap.
  const hits = pins.filter(pin => {
    const badge = pin.querySelector<HTMLElement>('.map-viewer-marker__collision-badge')
    return contains(measurePinVisualRect(pin), x, y)
      || Boolean(badge && !badge.hidden && contains(badge.getBoundingClientRect(), x, y))
  })
  // Equal z-index uses reverse DOM order, matching native CSS stacking.
  return hits.reverse().sort((a,b) => Number(b.style.zIndex)-Number(a.style.zIndex))[0] ?? origin
}

export function bindVisitorMarkerInteraction(element: HTMLElement, activate: () => void) {
  actions.set(element, activate)
  let pressed: HTMLElement | null = null
  // Capture before native focus enlarges a different PIN and recomputes collision.
  element.addEventListener('pointerdown', event => { pressed = artworkTarget(element, event.clientX, event.clientY) })
  element.addEventListener('pointercancel', () => { pressed = null })
  element.addEventListener('click', event => {
    event.stopPropagation()
    const target = event.detail === 0 ? element : pressed ?? artworkTarget(element, event.clientX, event.clientY)
    pressed = null
    actions.get(target)?.()
  })
}
