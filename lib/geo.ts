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

export type MapLibreImageCoordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
]

export function toImageCoordinates(coordinates: GeoReferenceCoordinates): MapLibreImageCoordinates {
  return [
    [coordinates.topLeft.lng, coordinates.topLeft.lat],
    [coordinates.topRight.lng, coordinates.topRight.lat],
    [coordinates.bottomRight.lng, coordinates.bottomRight.lat],
    [coordinates.bottomLeft.lng, coordinates.bottomLeft.lat],
  ]
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
