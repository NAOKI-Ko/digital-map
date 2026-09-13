import { isGeoReferenced, isValidImagePosition, renderToImageCoordinates, type FloorGeoReferenceFields, type ImagePosition } from './geo'
import type { GeocodeResult } from '../shared/types/geocode'

/** Returns a temporary IMAGE candidate only; callers explicitly persist x/y after confirmation. */
export function getAddressPlacementCandidate(
  floor: FloorGeoReferenceFields,
  result: Pick<GeocodeResult, 'lat' | 'lng'>,
): ImagePosition | null {
  if (!isGeoReferenced(floor)) return null
  const candidate = renderToImageCoordinates(floor, result)
  return candidate && isValidImagePosition(candidate) ? candidate : null
}
