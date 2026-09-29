export interface FitPadding { top: number, right: number, bottom: number, left: number }
export interface FitRect { top: number, right: number, bottom: number, left: number, width: number, height: number }

/** Reserve visible UI bands, not a guessed window size. Leave a usable rectangle on short screens. */
export function calculateVisitorFitPadding(viewport: FitRect, chrome: { edge: 'top' | 'bottom', rect: FitRect }[]): FitPadding {
  const margin = 24
  let top = margin
  let bottom = margin
  for (const { edge, rect } of chrome) {
    if (rect.width <= 0 || rect.height <= 0 || rect.right <= viewport.left || rect.left >= viewport.right) continue
    if (edge === 'top') top = Math.max(top, rect.bottom - viewport.top + 12)
    else bottom = Math.max(bottom, viewport.bottom - rect.top + 12)
  }
  const available = Math.max(0, viewport.height - 80)
  const scale = Math.min(1, available / Math.max(1, top + bottom))
  const horizontal = Math.min(margin, Math.max(0, (viewport.width - 80) / 2))
  return { top: top * scale, bottom: bottom * scale, left: horizontal, right: horizontal }
}

export function measureVisitorFitPadding(container: HTMLElement): FitPadding {
  const stage = container.closest('.public-map-stage')
  const chrome = [...(stage?.querySelectorAll<HTMLElement>('[data-map-fit-edge], .map-viewer-control-group') ?? [])]
    .map(element => ({
      edge: (element.dataset.mapFitEdge === 'bottom' ? 'bottom' : 'top') as 'top' | 'bottom',
      rect: element.getBoundingClientRect(),
    }))
  return calculateVisitorFitPadding(container.getBoundingClientRect(), chrome)
}
