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

export function createDefaultGeoReference(center: LatLng = { lat: 35.681236, lng: 139.767125 }): GeoReferenceCoordinates {
  const latitudeOffset = 0.0015
  const longitudeOffset = 0.002

  return {
    topLeft: { lat: center.lat + latitudeOffset, lng: center.lng - longitudeOffset },
    topRight: { lat: center.lat + latitudeOffset, lng: center.lng + longitudeOffset },
    bottomRight: { lat: center.lat - latitudeOffset, lng: center.lng + longitudeOffset },
    bottomLeft: { lat: center.lat - latitudeOffset, lng: center.lng - longitudeOffset },
  }
}

export function getGeoReferenceBounds(coordinates: GeoReferenceCoordinates) {
  const points = Object.values(coordinates)
  const lngs = points.map(point => point.lng)
  const lats = points.map(point => point.lat)

  return {
    southwest: [Math.min(...lngs), Math.min(...lats)] as [number, number],
    northeast: [Math.max(...lngs), Math.max(...lats)] as [number, number],
  }
}
