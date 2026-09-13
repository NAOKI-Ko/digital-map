import type { PinSize, SpotImportance } from '~~/shared/constants/spot'

export const NORMAL_SPOT_VISIBILITY_ZOOM_OFFSET = 1.5
export const PIN_SIZE_SCALES: Record<PinSize, number> = { small: 0.8, medium: 1, large: 1.25 }

export function getMarkerDensityPresentation(importance: SpotImportance, pinSize: PinSize, zoom: number, minimumZoom: number, selected = false, activeCategoryMatch = false) {
  if (selected) return { visible: true, scale: PIN_SIZE_SCALES[pinSize], priority: 4 }
  if (activeCategoryMatch) return { visible: true, scale: PIN_SIZE_SCALES[pinSize], priority: 3 }
  if (importance === 'featured') return { visible: true, scale: PIN_SIZE_SCALES[pinSize], priority: 2 }
  return { visible: zoom >= minimumZoom + NORMAL_SPOT_VISIBILITY_ZOOM_OFFSET, scale: PIN_SIZE_SCALES[pinSize], priority: 1 }
}

export function applyMarkerDensityPresentation(element: HTMLElement, presentation: ReturnType<typeof getMarkerDensityPresentation>) {
  element.hidden = !presentation.visible
  element.style.zIndex = String(presentation.priority)
  element.style.setProperty('--marker-size-scale', presentation.scale.toFixed(3))
}
