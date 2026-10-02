export const PIN_COLLISION_GAP = 10
export interface ScreenRect { left: number, top: number, right: number, bottom: number }
export interface CollisionCandidate { id: string, priority: number, protected?: boolean, rect: ScreenRect, centerDistance?: number }

export function rectanglesCollide(a: ScreenRect, b: ScreenRect, gap = PIN_COLLISION_GAP) {
  return a.left < b.right + gap && a.right + gap > b.left
    && a.top < b.bottom + gap && a.bottom + gap > b.top
}

const isProtected = (pin: CollisionCandidate) => Boolean(pin.protected) || pin.priority === 4

/** Protect selection/focus first; preserve the normal priority order and stable ID ties. */
export function declutterPins(candidates: readonly CollisionCandidate[], gap = PIN_COLLISION_GAP, previousWinners: ReadonlySet<string> = new Set()) {
  const accepted: CollisionCandidate[] = []
  for (const candidate of [...candidates].sort((a, b) => Number(isProtected(b)) - Number(isProtected(a)) || b.priority - a.priority || ((a.centerDistance ?? 0) - (previousWinners.has(a.id) ? 8 : 0)) - ((b.centerDistance ?? 0) - (previousWinners.has(b.id) ? 8 : 0)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    if (isProtected(candidate) || !accepted.some(pin => rectanglesCollide(pin.rect, candidate.rect, gap))) accepted.push(candidate)
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

/** Connected screen-space overlaps, including density-hidden members; no canonical writes. */
export function getCollisionGroup(id: string, candidates: readonly CollisionCandidate[]) {
  const first = candidates.find(pin => pin.id === id)
  if (!first) return []
  const group = [first], seen = new Set([id])
  for (let index = 0; index < group.length; index++) {
    for (const pin of candidates) {
      if (!seen.has(pin.id) && rectanglesCollide(group[index]!.rect, pin.rect)) {
        seen.add(pin.id)
        group.push(pin)
      }
    }
  }
  return group
}
