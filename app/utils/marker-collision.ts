export const PIN_COLLISION_GAP = 10
export interface ScreenRect { left: number, top: number, right: number, bottom: number }
export interface CollisionCandidate { id: string, priority: number, rect: ScreenRect }

export function rectanglesCollide(a: ScreenRect, b: ScreenRect, gap = PIN_COLLISION_GAP) {
  return a.left < b.right + gap && a.right + gap > b.left
    && a.top < b.bottom + gap && a.bottom + gap > b.top
}

/** Greedy presentation-only decluttering. IDs break ties independently of source order. */
export function declutterPins(candidates: readonly CollisionCandidate[], gap = PIN_COLLISION_GAP) {
  const accepted: CollisionCandidate[] = []
  for (const candidate of [...candidates].sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    if (candidate.priority === 4 || !accepted.some(pin => rectanglesCollide(pin.rect, candidate.rect, gap))) accepted.push(candidate)
  }
  return new Set(accepted.map(pin => pin.id))
}

/** Include both the hit target and scaled/rotated visible artwork (which can exceed it). */
export function measurePinRect(element: HTMLElement): ScreenRect {
  const rects = [element.getBoundingClientRect(), ...Array.from(element.querySelectorAll<HTMLElement>('.map-viewer-marker__shape, .map-viewer-marker__illustration')).map(child => child.getBoundingClientRect())]
  return { left: Math.min(...rects.map(r => r.left)), top: Math.min(...rects.map(r => r.top)), right: Math.max(...rects.map(r => r.right)), bottom: Math.max(...rects.map(r => r.bottom)) }
}

export function applyPinVisibility(element: HTMLElement, visible: boolean) {
  // visibility preserves measurable layout for hidden candidates; inert also prevents scripted focus.
  element.hidden = false
  element.style.visibility = visible ? '' : 'hidden'
  element.inert = !visible
  element.tabIndex = visible ? 0 : -1
  element.setAttribute('aria-hidden', String(!visible))
  element.dataset.pinVisible = String(visible)
  if (!visible && element.ownerDocument.activeElement === element) {
    element.closest<HTMLElement>('[role="region"]')?.focus({ preventScroll: true })
    element.blur()
  }
}
