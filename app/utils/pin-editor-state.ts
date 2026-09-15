import type { ImagePosition } from '~~/lib/geo'
import type { MapViewerSpot } from '~~/shared/types/map-viewer'
import type { SpotPinDesignResponse } from '~~/shared/types/spot'

export type PinEditorMode = 'idle' | 'placing' | 'moving' | 'designing'

export function isPositionEditing(mode: PinEditorMode) {
  return mode === 'placing' || mode === 'moving'
}

export function applySelectedPinDesignDraft(
  spots: readonly MapViewerSpot[],
  selectedSpotId: string,
  mode: PinEditorMode,
  draft: SpotPinDesignResponse['design'] | null,
) {
  if (mode !== 'designing' || !draft) return spots
  return spots.map(spot => spot.id === selectedSpotId ? { ...spot, ...draft } : spot)
}

export function toPositionUpdatePayload(position: ImagePosition) {
  return { x: position.x, y: position.y }
}

export function needsPinEditorDiscardConfirmation(
  mode: PinEditorMode,
  position: ImagePosition | null,
  designDirty: boolean,
) {
  return Boolean(position || (mode === 'designing' && designDirty))
}
