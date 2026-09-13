import {
  computeFallbackCorners,
  IMAGE_SPATIAL_MIGRATION_EPSILON,
  renderToImageCoordinates,
  snapMigrationImageCoordinate,
  type FloorGeoReferenceFields,
  type ImagePosition,
  type LatLng,
} from './geo'

export interface LegacyFloorSpatialFields {
  imageWidth: number
  imageHeight: number
  refAPixelX: number | null
  refAPixelY: number | null
  refALat: number | null
  refALng: number | null
  refBPixelX: number | null
  refBPixelY: number | null
  refBLat: number | null
  refBLng: number | null
}

export function hasCompleteLegacyGeoReference(floor: LegacyFloorSpatialFields) {
  return [
    floor.refAPixelX,
    floor.refAPixelY,
    floor.refALat,
    floor.refALng,
    floor.refBPixelX,
    floor.refBPixelY,
    floor.refBLat,
    floor.refBLng,
  ].every(value => value !== null && Number.isFinite(value))
}

export function normalizeLegacyFloorReference(
  floor: LegacyFloorSpatialFields,
): FloorGeoReferenceFields {
  const normalized = (value: number | null, dimension: number) => value === null
    ? null
    : snapMigrationImageCoordinate(value / dimension)

  return {
    imageWidth: floor.imageWidth,
    imageHeight: floor.imageHeight,
    refAImageX: normalized(floor.refAPixelX, floor.imageWidth),
    refAImageY: normalized(floor.refAPixelY, floor.imageHeight),
    refALat: floor.refALat,
    refALng: floor.refALng,
    refBImageX: normalized(floor.refBPixelX, floor.imageWidth),
    refBImageY: normalized(floor.refBPixelY, floor.imageHeight),
    refBLat: floor.refBLat,
    refBLng: floor.refBLng,
  }
}

/**
 * Invert the exact render transform used immediately before the IMAGE x/y migration.
 * The result is intentionally not clamped; the preflight must report genuine exceptions.
 */
export function invertLegacySpotPosition(
  floor: LegacyFloorSpatialFields,
  position: LatLng,
): ImagePosition | null {
  if (floor.imageWidth <= 0 || floor.imageHeight <= 0) return null
  if (!hasCompleteLegacyGeoReference(floor)) {
    const corners = computeFallbackCorners(floor.imageWidth, floor.imageHeight)
    const lngSpan = corners.topRight.lng - corners.topLeft.lng
    const latSpan = corners.topLeft.lat - corners.bottomLeft.lat
    return {
      x: snapMigrationImageCoordinate((position.lng - corners.topLeft.lng) / lngSpan),
      y: snapMigrationImageCoordinate((corners.topLeft.lat - position.lat) / latSpan),
    }
  }

  const raw = renderToImageCoordinates(normalizeLegacyFloorReference(floor), position)
  return raw && {
    x: snapMigrationImageCoordinate(raw.x),
    y: snapMigrationImageCoordinate(raw.y),
  }
}

export function isMigrationImagePositionInBounds(position: ImagePosition) {
  return position.x >= -IMAGE_SPATIAL_MIGRATION_EPSILON
    && position.x <= 1 + IMAGE_SPATIAL_MIGRATION_EPSILON
    && position.y >= -IMAGE_SPATIAL_MIGRATION_EPSILON
    && position.y <= 1 + IMAGE_SPATIAL_MIGRATION_EPSILON
}
