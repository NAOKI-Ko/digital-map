export interface LatLng {
  lat: number
  lng: number
}

/** 軸に沿った矩形を、保存対象である左上・右下の2点で表す。 */
export interface GeoReferenceRectangle {
  topLeft: LatLng
  bottomRight: LatLng
}

export interface GeoReferenceFields {
  topLeftLat: number | null
  topLeftLng: number | null
  bottomRightLat: number | null
  bottomRightLng: number | null
}

export type GeoReferenceCorner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'

export type MapLibreImageCoordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
]

export const MIN_GEOREFERENCE_SPAN = 0.000001
export const MAX_GEOREFERENCE_SPAN = 2
export const DEFAULT_RECTANGLE_VIEWPORT_RATIO = 0.4

/** MapLibreが世界を周回した際の経度を[-180, 180)へ戻す。 */
export function normalizeLongitude(lng: number) {
  if (!Number.isFinite(lng)) return lng
  if (lng >= -180 && lng < 180) return lng
  const wrapped = ((lng + 180) % 360 + 360) % 360 - 180
  return Number(wrapped.toFixed(12))
}

export function normalizeGeoReferenceRectangle(
  rectangle: GeoReferenceRectangle,
): GeoReferenceRectangle {
  return {
    topLeft: { ...rectangle.topLeft, lng: normalizeLongitude(rectangle.topLeft.lng) },
    bottomRight: { ...rectangle.bottomRight, lng: normalizeLongitude(rectangle.bottomRight.lng) },
  }
}

export function getRectangleCorners(rectangle: GeoReferenceRectangle) {
  return {
    topLeft: rectangle.topLeft,
    topRight: {
      lat: rectangle.topLeft.lat,
      lng: rectangle.bottomRight.lng,
    },
    bottomRight: rectangle.bottomRight,
    bottomLeft: {
      lat: rectangle.bottomRight.lat,
      lng: rectangle.topLeft.lng,
    },
  } satisfies Record<GeoReferenceCorner, LatLng>
}

export function toImageCoordinates(rectangle: GeoReferenceRectangle): MapLibreImageCoordinates {
  const corners = getRectangleCorners(rectangle)
  return [
    [corners.topLeft.lng, corners.topLeft.lat],
    [corners.topRight.lng, corners.topRight.lat],
    [corners.bottomRight.lng, corners.bottomRight.lat],
    [corners.bottomLeft.lng, corners.bottomLeft.lat],
  ]
}

export function isValidLatLng(value: LatLng) {
  return Number.isFinite(value.lat)
    && Number.isFinite(value.lng)
    && value.lat >= -90
    && value.lat <= 90
    && value.lng >= -180
    && value.lng <= 180
}

export function getGeoReferenceValidationError(rectangle: GeoReferenceRectangle) {
  if (!isValidLatLng(rectangle.topLeft) || !isValidLatLng(rectangle.bottomRight)) {
    return '緯度経度の値を確認してください。'
  }

  const latitudeSpan = rectangle.topLeft.lat - rectangle.bottomRight.lat
  const longitudeSpan = rectangle.bottomRight.lng - rectangle.topLeft.lng
  if (latitudeSpan <= 0 || longitudeSpan <= 0) {
    return '左上は右下より北かつ西に設定してください。'
  }
  if (latitudeSpan < MIN_GEOREFERENCE_SPAN || longitudeSpan < MIN_GEOREFERENCE_SPAN) {
    return '矩形の幅と高さを確保してください。'
  }
  if (latitudeSpan > MAX_GEOREFERENCE_SPAN || longitudeSpan > MAX_GEOREFERENCE_SPAN) {
    return `設定範囲は緯度・経度とも${MAX_GEOREFERENCE_SPAN}度以内にしてください。`
  }
  return null
}

export function isValidGeoReference(rectangle: GeoReferenceRectangle) {
  return getGeoReferenceValidationError(rectangle) === null
}

export function getFloorGeoReference(floor: GeoReferenceFields): GeoReferenceRectangle | null {
  const values = [
    floor.topLeftLat,
    floor.topLeftLng,
    floor.bottomRightLat,
    floor.bottomRightLng,
  ]
  if (values.some(value => value === null)) return null

  const rectangle: GeoReferenceRectangle = {
    topLeft: { lat: floor.topLeftLat!, lng: floor.topLeftLng! },
    bottomRight: { lat: floor.bottomRightLat!, lng: floor.bottomRightLng! },
  }

  return isValidGeoReference(rectangle) ? rectangle : null
}

export function createGeoReferenceFromBounds(bounds: {
  southwest: LatLng
  northeast: LatLng
}): GeoReferenceRectangle {
  return {
    topLeft: { lat: bounds.northeast.lat, lng: bounds.southwest.lng },
    bottomRight: { lat: bounds.southwest.lat, lng: bounds.northeast.lng },
  }
}

/** 現在の表示範囲中央へ、表示幅・高さの40%（最大2度）の初期矩形を作る。 */
export function createDefaultGeoReferenceRectangle(bounds: {
  southwest: LatLng
  northeast: LatLng
}, viewportRatio = DEFAULT_RECTANGLE_VIEWPORT_RATIO): GeoReferenceRectangle {
  const west = Math.max(-180, Math.min(180, bounds.southwest.lng))
  const east = Math.max(-180, Math.min(180, bounds.northeast.lng))
  const south = Math.max(-90, Math.min(90, bounds.southwest.lat))
  const north = Math.max(-90, Math.min(90, bounds.northeast.lat))
  const centerLng = (west + east) / 2
  const centerLat = (south + north) / 2
  const width = Math.min(
    MAX_GEOREFERENCE_SPAN,
    Math.max(MIN_GEOREFERENCE_SPAN, Math.abs(east - west) * viewportRatio),
  )
  const height = Math.min(
    MAX_GEOREFERENCE_SPAN,
    Math.max(MIN_GEOREFERENCE_SPAN, Math.abs(north - south) * viewportRatio),
  )
  const left = Math.max(-180, Math.min(180 - width, centerLng - width / 2))
  const bottom = Math.max(-90, Math.min(90 - height, centerLat - height / 2))

  return {
    topLeft: { lat: bottom + height, lng: left },
    bottomRight: { lat: bottom, lng: left + width },
  }
}

export function resizeGeoReferenceRectangle(
  rectangle: GeoReferenceRectangle,
  corner: GeoReferenceCorner,
  position: LatLng,
): GeoReferenceRectangle {
  const topLeft = { ...rectangle.topLeft }
  const bottomRight = { ...rectangle.bottomRight }
  const touchesTop = corner === 'topLeft' || corner === 'topRight'
  const touchesLeft = corner === 'topLeft' || corner === 'bottomLeft'

  if (touchesTop) {
    topLeft.lat = clamp(position.lat, bottomRight.lat + MIN_GEOREFERENCE_SPAN, bottomRight.lat + MAX_GEOREFERENCE_SPAN)
  }
  else {
    bottomRight.lat = clamp(position.lat, topLeft.lat - MAX_GEOREFERENCE_SPAN, topLeft.lat - MIN_GEOREFERENCE_SPAN)
  }

  if (touchesLeft) {
    topLeft.lng = clamp(position.lng, bottomRight.lng - MAX_GEOREFERENCE_SPAN, bottomRight.lng - MIN_GEOREFERENCE_SPAN)
  }
  else {
    bottomRight.lng = clamp(position.lng, topLeft.lng + MIN_GEOREFERENCE_SPAN, topLeft.lng + MAX_GEOREFERENCE_SPAN)
  }

  topLeft.lat = clamp(topLeft.lat, -90, 90)
  topLeft.lng = clamp(topLeft.lng, -180, 180)
  bottomRight.lat = clamp(bottomRight.lat, -90, 90)
  bottomRight.lng = clamp(bottomRight.lng, -180, 180)
  return { topLeft, bottomRight }
}

export function moveGeoReferenceRectangle(
  rectangle: GeoReferenceRectangle,
  delta: LatLng,
): GeoReferenceRectangle {
  const latitudeSpan = rectangle.topLeft.lat - rectangle.bottomRight.lat
  const longitudeSpan = rectangle.bottomRight.lng - rectangle.topLeft.lng
  const left = clamp(rectangle.topLeft.lng + delta.lng, -180, 180 - longitudeSpan)
  const bottom = clamp(rectangle.bottomRight.lat + delta.lat, -90, 90 - latitudeSpan)

  return {
    topLeft: { lat: bottom + latitudeSpan, lng: left },
    bottomRight: { lat: bottom, lng: left + longitudeSpan },
  }
}

export function getGeoReferenceBounds(rectangle: GeoReferenceRectangle) {
  return {
    southwest: [rectangle.topLeft.lng, rectangle.bottomRight.lat] as [number, number],
    northeast: [rectangle.bottomRight.lng, rectangle.topLeft.lat] as [number, number],
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}
