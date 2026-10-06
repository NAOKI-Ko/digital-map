/** A mount owns initial framing only until the first exploration intent. */
export function createVisitorInitialViewportLease(enabled: boolean) {
  let phase: 'waiting' | 'pristine' | 'released' = enabled ? 'waiting' : 'released'
  let layout = ''
  let generation = 0
  return {
    noteInitialFit(key: string) {
      if (phase === 'waiting') layout = key
    },
    cancel() { generation++ },
    release() { phase = 'released'; generation++ },
    isAvailable: () => phase !== 'released',
    request(key: string, eligible: boolean) {
      generation++
      if (phase === 'released' || !eligible) return null
      phase = 'pristine'
      return key === layout ? null : { key, generation }
    },
    canCommit(token: { key: string, generation: number }, key: string, eligible: boolean) {
      return phase === 'pristine' && eligible && token.generation === generation && token.key === key
    },
    committed(token: { key: string, generation: number }) {
      if (phase === 'pristine' && token.generation === generation) layout = token.key
    },
  }
}

/** Locale text and resource URLs do not constitute a new floor geometry. */
export function visitorFloorGeometryKey(floor: {
  id: string, imageWidth?: number | null, imageHeight?: number | null,
  refAImageX?: number | null, refAImageY?: number | null, refALat?: number | null, refALng?: number | null,
  refBImageX?: number | null, refBImageY?: number | null, refBLat?: number | null, refBLng?: number | null,
}) {
  return JSON.stringify([floor.id, floor.imageWidth, floor.imageHeight,
    floor.refAImageX, floor.refAImageY, floor.refALat, floor.refALng,
    floor.refBImageX, floor.refBImageY, floor.refBLat, floor.refBLng])
}

/** Capture intent before shell controls mutate state, including synthetic .click(). */
export function bindVisitorInitialViewportIntents(root: HTMLElement, release: () => void) {
  const onKey = (event: KeyboardEvent) => {
    const target = event.target instanceof Element ? event.target : null
    const canvas = target?.matches('.maplibregl-canvas')
    if ((canvas && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'].includes(event.key))
      || (target?.closest('button, select, input, [role="button"]') && ['Enter', ' '].includes(event.key))) release()
  }
  const onFocus = (event: FocusEvent) => {
    if (event.target instanceof Element && event.target.closest('.map-viewer-marker, .map-viewer-spiderfy')) release()
  }
  for (const name of ['pointerdown', 'touchstart', 'wheel', 'click']) root.addEventListener(name, release, true)
  root.addEventListener('keydown', onKey, true)
  root.addEventListener('focusin', onFocus, true)
  return () => {
    for (const name of ['pointerdown', 'touchstart', 'wheel', 'click']) root.removeEventListener(name, release, true)
    root.removeEventListener('keydown', onKey, true)
    root.removeEventListener('focusin', onFocus, true)
  }
}
