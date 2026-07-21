export interface LatLng {
  lat: number
  lng: number
}

export interface GeoReferenceCoordinates {
  topLeft: LatLng
  topRight: LatLng
  bottomRight: LatLng
  bottomLeft: LatLng
}

export interface GeoReferenceFields {
  topLeftLat: number | null
  topLeftLng: number | null
  topRightLat: number | null
  topRightLng: number | null
  bottomRightLat: number | null
  bottomRightLng: number | null
  bottomLeftLat: number | null
  bottomLeftLng: number | null
}

export type MapLibreImageCoordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
]

/** MapLibreが世界を周回した際の経度を[-180, 180)へ戻す。 */
export function normalizeLongitude(lng: number) {
  if (!Number.isFinite(lng)) return lng
  if (lng >= -180 && lng < 180) return lng
  const wrapped = ((lng + 180) % 360 + 360) % 360 - 180
  return Number(wrapped.toFixed(12))
}

export function normalizeGeoReferenceLongitudes(
  coordinates: GeoReferenceCoordinates,
): GeoReferenceCoordinates {
  return {
    topLeft: { ...coordinates.topLeft, lng: normalizeLongitude(coordinates.topLeft.lng) },
    topRight: { ...coordinates.topRight, lng: normalizeLongitude(coordinates.topRight.lng) },
    bottomRight: { ...coordinates.bottomRight, lng: normalizeLongitude(coordinates.bottomRight.lng) },
    bottomLeft: { ...coordinates.bottomLeft, lng: normalizeLongitude(coordinates.bottomLeft.lng) },
  }
}

export function toImageCoordinates(coordinates: GeoReferenceCoordinates): MapLibreImageCoordinates {
  return [
    [coordinates.topLeft.lng, coordinates.topLeft.lat],
    [coordinates.topRight.lng, coordinates.topRight.lat],
    [coordinates.bottomRight.lng, coordinates.bottomRight.lat],
    [coordinates.bottomLeft.lng, coordinates.bottomLeft.lat],
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

export function isValidGeoReference(coordinates: GeoReferenceCoordinates) {
  const corners = [
    coordinates.topLeft,
    coordinates.topRight,
    coordinates.bottomRight,
    coordinates.bottomLeft,
  ]

  if (!corners.every(isValidLatLng)) return false
  if (new Set(corners.map(corner => `${corner.lat},${corner.lng}`)).size !== corners.length) return false

  const [topLeft, topRight, bottomRight, bottomLeft] = corners as [LatLng, LatLng, LatLng, LatLng]
  if (
    segmentsIntersect(topLeft, topRight, bottomRight, bottomLeft)
    || segmentsIntersect(topRight, bottomRight, bottomLeft, topLeft)
  ) return false

  return Math.abs(corners.reduce((area, corner, index) => {
    const next = corners[(index + 1) % corners.length]!
    return area + corner.lng * next.lat - next.lng * corner.lat
  }, 0)) > Number.EPSILON
}

export function getFloorGeoReference(floor: GeoReferenceFields): GeoReferenceCoordinates | null {
  const values = [
    floor.topLeftLat,
    floor.topLeftLng,
    floor.topRightLat,
    floor.topRightLng,
    floor.bottomRightLat,
    floor.bottomRightLng,
    floor.bottomLeftLat,
    floor.bottomLeftLng,
  ]
  if (values.some(value => value === null)) return null

  const coordinates: GeoReferenceCoordinates = {
    topLeft: { lat: floor.topLeftLat!, lng: floor.topLeftLng! },
    topRight: { lat: floor.topRightLat!, lng: floor.topRightLng! },
    bottomRight: { lat: floor.bottomRightLat!, lng: floor.bottomRightLng! },
    bottomLeft: { lat: floor.bottomLeftLat!, lng: floor.bottomLeftLng! },
  }

  return isValidGeoReference(coordinates) ? coordinates : null
}

export function createGeoReferenceFromBounds(bounds: { southwest: LatLng, northeast: LatLng }): GeoReferenceCoordinates {
  return {
    topLeft: { lat: bounds.northeast.lat, lng: bounds.southwest.lng },
    topRight: { lat: bounds.northeast.lat, lng: bounds.northeast.lng },
    bottomRight: { lat: bounds.southwest.lat, lng: bounds.northeast.lng },
    bottomLeft: { lat: bounds.southwest.lat, lng: bounds.southwest.lng },
  }
}

export function getGeoReferenceBounds(coordinates: GeoReferenceCoordinates) {
  return getLatLngBounds(Object.values(coordinates))
}

export function getLatLngBounds(points: LatLng[]) {
  if (points.length === 0) return null
  const lngs = points.map(point => point.lng)
  const lats = points.map(point => point.lat)

  return {
    southwest: [Math.min(...lngs), Math.min(...lats)] as [number, number],
    northeast: [Math.max(...lngs), Math.max(...lats)] as [number, number],
  }
}

function segmentsIntersect(startA: LatLng, endA: LatLng, startB: LatLng, endB: LatLng) {
  const orientation = (start: LatLng, end: LatLng, point: LatLng) =>
    (end.lng - start.lng) * (point.lat - start.lat)
    - (end.lat - start.lat) * (point.lng - start.lng)

  const first = orientation(startA, endA, startB)
  const second = orientation(startA, endA, endB)
  const third = orientation(startB, endB, startA)
  const fourth = orientation(startB, endB, endA)

  return first * second < 0 && third * fourth < 0
}
