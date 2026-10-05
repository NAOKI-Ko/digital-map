export const PIN_COLLISION_GAP = 6
// Visitor artwork clearance, independent of the 60px interaction target.
export const VISITOR_PIN_COLLISION_GAP = 0
export interface ScreenRect { left: number, top: number, right: number, bottom: number }
export interface CollisionCandidate { id: string, priority: number, protected?: boolean, rect: ScreenRect, centerDistance?: number }

export function rectanglesCollide(a: ScreenRect, b: ScreenRect, gap = PIN_COLLISION_GAP) {
  return a.left < b.right + gap && a.right + gap > b.left
    && a.top < b.bottom + gap && a.bottom + gap > b.top
}

const isProtected = (pin: CollisionCandidate) => Boolean(pin.protected) || pin.priority === 4

/** Protect selection/focus first; preserve the normal priority order and stable ID ties. */
export function declutterPins(candidates: readonly CollisionCandidate[], gap = PIN_COLLISION_GAP, previousWinners: ReadonlySet<string> = new Set(), viewport?: ScreenRect) {
  const accepted: CollisionCandidate[] = []
  // Retain equal-priority winners and their order while panning. Center distance
  // chooses new winners; it must not continually move a group's badge between PINs.
  const retainedOrder = new Map([...previousWinners].map((id, index) => [id, index]))
  const rank = (id: string) => retainedOrder.get(id) ?? previousWinners.size
  // Offscreen winners cannot block reachable neighbors or own their recovery badge.
  const onscreen = candidates.filter(pin => !viewport || rectanglesCollide(pin.rect, viewport, 0))
  for (const candidate of onscreen.sort((a, b) => Number(isProtected(b)) - Number(isProtected(a)) || b.priority - a.priority || rank(a.id) - rank(b.id) || (a.centerDistance ?? 0) - (b.centerDistance ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    if (isProtected(candidate) || !accepted.some(pin => rectanglesCollide(pin.rect, candidate.rect, gap))) accepted.push(candidate)
  }
  return new Set(accepted.map(pin => pin.id))
}

/** Include both the hit target and scaled/rotated visible artwork (which can exceed it). */
export function measurePinRect(element: HTMLElement): ScreenRect {
  const rects = [element.getBoundingClientRect(), ...Array.from(element.querySelectorAll<HTMLElement>('.map-viewer-marker__shape, .map-viewer-marker__illustration')).map(child => child.getBoundingClientRect())]
  return { left: Math.min(...rects.map(r => r.left)), top: Math.min(...rects.map(r => r.top)), right: Math.max(...rects.map(r => r.right)), bottom: Math.max(...rects.map(r => r.bottom)) }
}

/** Bounds of the painted teardrop: a -45deg square with three circular corners.
 * getBoundingClientRect includes transparent corners of the rotated CSS box.
 * Trim those three sides; the unrounded bottom-left corner is the ground tip.
 * Size/selection scale is already included in the measured screen-space rect.
 */
export function pinArtworkBounds(rect: ScreenRect): ScreenRect {
  const trim = (rect.right - rect.left) * (1 - 1 / Math.SQRT2) / 2
  return { left: rect.left + trim, right: rect.right - trim, top: rect.top + trim, bottom: rect.bottom }
}

/** Visitor-only collision footprint. Never includes the transparent button, label,
 * diffuse shadow or collision badge (badge inclusion would feed back into grouping).
 * Custom images inside a PIN use its painted shell; illustrations use image bounds.
 */
export function measurePinVisualRect(element: HTMLElement): ScreenRect {
  const shape = element.querySelector<HTMLElement>('.map-viewer-marker__shape')
  const illustration = element.querySelector<HTMLElement>('.map-viewer-marker__illustration')
  const artwork = shape ?? illustration
  if (!artwork) return element.getBoundingClientRect()
  const measured = artwork.getBoundingClientRect()
  const facility = element.classList.contains('map-viewer-marker--facility')
  let rect: ScreenRect = shape && !facility ? pinArtworkBounds(measured)
    : { left: measured.left, top: measured.top, right: measured.right, bottom: measured.bottom }
  const image = illustration?.querySelector<HTMLImageElement>('img')
  // object-fit:contain can letterbox a very wide image inside the capped image box.
  if (image?.naturalWidth && image.naturalHeight) {
    const box = image.getBoundingClientRect()
    const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight)
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale
    rect = { left: box.left + (box.width-width)/2, right: box.right - (box.width-width)/2,
      top: box.top + (box.height-height)/2, bottom: box.bottom - (box.height-height)/2 }
  }
  if (element.classList.contains('map-viewer-marker--selected') || (facility && element.matches(':focus-visible'))) {
    // Public selection outline: 2px + 2px offset, transformed with the artwork.
    const scale = measured.width / (artwork.offsetWidth * (shape && !facility ? Math.SQRT2 : 1))
    const ring = 4 * (Number.isFinite(scale) ? scale : 1)
    const base = illustration ? measured : rect
    rect = { left: base.left-ring, right: base.right+ring, top: base.top-ring, bottom: base.bottom+ring }
  }
  const decoration = element.querySelector<HTMLElement>('.map-viewer-marker__featured')?.getBoundingClientRect()
  if (decoration) rect = { left: Math.min(rect.left, decoration.left), right: Math.max(rect.right, decoration.right),
    top: Math.min(rect.top, decoration.top), bottom: Math.max(rect.bottom, decoration.bottom) }
  return rect
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
export function getCollisionGroup(id: string, candidates: readonly CollisionCandidate[], gap = PIN_COLLISION_GAP) {
  const first = candidates.find(pin => pin.id === id)
  if (!first) return []
  const group = [first], seen = new Set([id])
  for (let index = 0; index < group.length; index++) {
    for (const pin of candidates) {
      if (!seen.has(pin.id) && rectanglesCollide(group[index]!.rect, pin.rect, gap)) {
        seen.add(pin.id)
        group.push(pin)
      }
    }
  }
  return group
}

/** One visible representative owns each connected group's count and recovery. */
export function getCollisionRepresentatives(candidates: readonly CollisionCandidate[], visible: ReadonlySet<string>, gap = PIN_COLLISION_GAP) {
  const counts = new Map<string, number>()
  const seen = new Set<string>()
  for (const candidate of candidates) {
    if (seen.has(candidate.id)) continue
    const group = getCollisionGroup(candidate.id, candidates, gap)
    group.forEach(pin => seen.add(pin.id))
    // Set insertion order is the existing declutter priority/tie order.
    const representative = [...visible].find(id => group.some(pin => pin.id === id))
    if (representative && group.length > 1) counts.set(representative, group.length)
  }
  return counts
}
