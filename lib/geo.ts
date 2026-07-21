export interface LatLng {
  lat: number
  lng: number
}

export interface FloorGeoReferenceFields {
  imageWidth: number | null
  imageHeight: number | null
  refAPixelX: number | null
  refAPixelY: number | null
  refALat: number | null
  refALng: number | null
  refBPixelX: number | null
  refBPixelY: number | null
  refBLat: number | null
  refBLng: number | null
}

export interface CompleteFloorGeoReference {
  imageWidth: number
  imageHeight: number
  refAPixelX: number
  refAPixelY: number
  refALat: number
  refALng: number
  refBPixelX: number
  refBPixelY: number
  refBLat: number
  refBLng: number
}

export type FloorCornerName = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'
export type FloorCorners = Record<FloorCornerName, LatLng>

export type MapLibreImageCoordinates = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
]

export const MIN_REFERENCE_PIXEL_DISTANCE = 50
export const MIN_REFERENCE_METER_DISTANCE = 20
export const REFERENCE_DISTANCE_ERROR = '基準点が近すぎます。もっと離れた目印を選んでください。'

const EARTH_RADIUS_METERS = 6_378_137

function lngLatToLocalMeters(lat: number, lng: number, originLat: number, originLng: number) {
  const radians = Math.PI / 180
  return {
    x: (lng - originLng) * radians * EARTH_RADIUS_METERS * Math.cos(originLat * radians),
    y: (lat - originLat) * radians * EARTH_RADIUS_METERS,
  }
}

function localMetersToLngLat(x: number, y: number, originLat: number, originLng: number): LatLng {
  const degrees = 180 / Math.PI
  return {
    lat: originLat + (y / EARTH_RADIUS_METERS) * degrees,
    lng: originLng + (x / (EARTH_RADIUS_METERS * Math.cos(originLat * Math.PI / 180))) * degrees,
  }
}

export function getReferencePointDistances(floor: CompleteFloorGeoReference) {
  const pixelDistance = Math.hypot(
    floor.refBPixelX - floor.refAPixelX,
    floor.refBPixelY - floor.refAPixelY,
  )
  const bMeters = lngLatToLocalMeters(
    floor.refBLat,
    floor.refBLng,
    floor.refALat,
    floor.refALng,
  )

  return {
    pixelDistance,
    meterDistance: Math.hypot(bMeters.x, bMeters.y),
  }
}

/**
 * イラスト上と実地図上の対応点A・Bから、一様縮尺・回転・平行移動だけの
 * 相似変換を求め、画像の4隅を緯度経度へ変換する。
 */
export function computeFloorCorners(floor: CompleteFloorGeoReference): FloorCorners {
  const inputError = getGeoReferenceInputError(floor)
  if (inputError) throw new Error(inputError)

  const origin = { lat: floor.refALat, lng: floor.refALng }
  const bMeters = lngLatToLocalMeters(floor.refBLat, floor.refBLng, origin.lat, origin.lng)
  const pxDx = floor.refBPixelX - floor.refAPixelX
  const pxDy = floor.refBPixelY - floor.refAPixelY
  const { pixelDistance, meterDistance } = getReferencePointDistances(floor)

  if (pixelDistance < MIN_REFERENCE_PIXEL_DISTANCE || meterDistance < MIN_REFERENCE_METER_DISTANCE) {
    throw new Error(REFERENCE_DISTANCE_ERROR)
  }

  const scale = meterDistance / pixelDistance
  const pixelAngle = Math.atan2(-pxDy, pxDx)
  const metersAngle = Math.atan2(bMeters.y, bMeters.x)
  const rotation = metersAngle - pixelAngle
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)

  function corner(px: number, py: number): LatLng {
    const dx = px - floor.refAPixelX
    const dy = -(py - floor.refAPixelY)
    const x = (dx * cos - dy * sin) * scale
    const y = (dx * sin + dy * cos) * scale
    return localMetersToLngLat(x, y, origin.lat, origin.lng)
  }

  return {
    topLeft: corner(0, 0),
    topRight: corner(floor.imageWidth, 0),
    bottomRight: corner(floor.imageWidth, floor.imageHeight),
    bottomLeft: corner(0, floor.imageHeight),
  }
}

export function getGeoReferenceValidationError(floor: CompleteFloorGeoReference) {
  const inputError = getGeoReferenceInputError(floor)
  if (inputError) return inputError

  const { pixelDistance, meterDistance } = getReferencePointDistances(floor)
  if (pixelDistance < MIN_REFERENCE_PIXEL_DISTANCE || meterDistance < MIN_REFERENCE_METER_DISTANCE) {
    return REFERENCE_DISTANCE_ERROR
  }

  return null
}

function getGeoReferenceInputError(floor: CompleteFloorGeoReference) {
  const values = Object.values(floor)
  if (values.some(value => !Number.isFinite(value))) {
    return '基準点の値を確認してください。'
  }
  if (!Number.isInteger(floor.imageWidth) || !Number.isInteger(floor.imageHeight)
    || floor.imageWidth <= 0 || floor.imageHeight <= 0) {
    return '画像の幅と高さを確認してください。'
  }
  if (!isValidLatLng({ lat: floor.refALat, lng: floor.refALng })
    || !isValidLatLng({ lat: floor.refBLat, lng: floor.refBLng })) {
    return '基準点の緯度経度を確認してください。'
  }
  if (floor.refAPixelX < 0 || floor.refAPixelX > floor.imageWidth
    || floor.refBPixelX < 0 || floor.refBPixelX > floor.imageWidth
    || floor.refAPixelY < 0 || floor.refAPixelY > floor.imageHeight
    || floor.refBPixelY < 0 || floor.refBPixelY > floor.imageHeight) {
    return 'イラスト上の基準点を画像の内側で選んでください。'
  }
  return null
}

export function getCompleteFloorGeoReference(
  floor: FloorGeoReferenceFields,
): CompleteFloorGeoReference | null {
  const values = [
    floor.imageWidth,
    floor.imageHeight,
    floor.refAPixelX,
    floor.refAPixelY,
    floor.refALat,
    floor.refALng,
    floor.refBPixelX,
    floor.refBPixelY,
    floor.refBLat,
    floor.refBLng,
  ]

  if (values.some(value => value === null || !Number.isFinite(value))) return null
  if (floor.imageWidth! <= 0 || floor.imageHeight! <= 0) return null

  return floor as CompleteFloorGeoReference
}

export function getFloorCorners(floor: FloorGeoReferenceFields): FloorCorners | null {
  const complete = getCompleteFloorGeoReference(floor)
  if (!complete) return null

  try {
    return computeFloorCorners(complete)
  }
  catch {
    return null
  }
}

export function toImageCoordinates(corners: FloorCorners): MapLibreImageCoordinates {
  return [
    [corners.topLeft.lng, corners.topLeft.lat],
    [corners.topRight.lng, corners.topRight.lat],
    [corners.bottomRight.lng, corners.bottomRight.lat],
    [corners.bottomLeft.lng, corners.bottomLeft.lat],
  ]
}

export function getGeoReferenceBounds(corners: FloorCorners) {
  const points = Object.values(corners)
  return {
    southwest: [
      Math.min(...points.map(point => point.lng)),
      Math.min(...points.map(point => point.lat)),
    ] as [number, number],
    northeast: [
      Math.max(...points.map(point => point.lng)),
      Math.max(...points.map(point => point.lat)),
    ] as [number, number],
  }
}

export function isValidLatLng(value: LatLng) {
  return Number.isFinite(value.lat)
    && Number.isFinite(value.lng)
    && value.lat >= -90
    && value.lat <= 90
    && value.lng >= -180
    && value.lng <= 180
}
