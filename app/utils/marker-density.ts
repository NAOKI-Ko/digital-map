import type { SpotImportance } from '~~/shared/constants/spot'

export const NORMAL_SPOT_FULL_VISIBILITY_OFFSET = 2
export const NORMAL_SPOT_MIN_OPACITY = 0.35
export const NORMAL_SPOT_MIN_SCALE = 0.78
export const FEATURED_SPOT_SCALE = 1.12

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

export function getMarkerDensityPresentation(
  importance: SpotImportance,
  zoom: number,
  minimumZoom: number,
  selected = false,
) {
  if (selected) {
    return { opacity: 1, scale: 1, priority: 3 }
  }
  if (importance === 'featured') {
    return {
      opacity: 1,
      scale: FEATURED_SPOT_SCALE,
      priority: 2,
    }
  }

  const progress = clamp((zoom - minimumZoom) / NORMAL_SPOT_FULL_VISIBILITY_OFFSET, 0, 1)
  return {
    opacity: NORMAL_SPOT_MIN_OPACITY + (1 - NORMAL_SPOT_MIN_OPACITY) * progress,
    scale: NORMAL_SPOT_MIN_SCALE + (1 - NORMAL_SPOT_MIN_SCALE) * progress,
    priority: 1,
  }
}

export function applyMarkerDensityPresentation(
  element: HTMLElement,
  presentation: ReturnType<typeof getMarkerDensityPresentation>,
) {
  element.style.opacity = presentation.opacity.toFixed(3)
  element.style.zIndex = String(presentation.priority)
  element.style.setProperty('--marker-density-scale', presentation.scale.toFixed(3))
}
