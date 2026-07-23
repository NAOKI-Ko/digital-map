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
export const FALLBACK_ORIGIN = { lat: 0, lng: 0 } as const
export const FALLBACK_EXTENT_DEG = 0.01
export const AREA_MARGIN_METERS = 300

const EARTH_RADIUS_METERS = 6_378_137
const GEO_REFERENCE_FIELDS = [
  'refAPixelX',
  'refAPixelY',
  'refALat',
  'refALng',
  'refBPixelX',
  'refBPixelY',
  'refBLat',
  'refBLng',
] as const

/**
 * ジオリファレンス未設定のフロア向けに、画像の縦横比を保った疑似座標を返す。
 * 2点合わせとは独立しており、実世界の位置を表すものではない。
 */
export function computeFallbackCorners(imageWidth: number, imageHeight: number): FloorCorners {
  if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight)
    || imageWidth <= 0 || imageHeight <= 0) {
    throw new Error('画像の幅と高さを確認してください。')
  }

  const aspect = imageWidth / imageHeight
  const halfLng = aspect >= 1
    ? FALLBACK_EXTENT_DEG / 2
    : (FALLBACK_EXTENT_DEG * aspect) / 2
  const halfLat = aspect >= 1
    ? (FALLBACK_EXTENT_DEG / aspect) / 2
    : FALLBACK_EXTENT_DEG / 2
  const { lat, lng } = FALLBACK_ORIGIN

  return {
    topLeft: { lat: lat + halfLat, lng: lng - halfLng },
    topRight: { lat: lat + halfLat, lng: lng + halfLng },
    bottomRight: { lat: lat - halfLat, lng: lng + halfLng },
    bottomLeft: { lat: lat - halfLat, lng: lng - halfLng },
  }
}

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
  if (!isGeoReferenced(floor)) return null
  if (floor.imageWidth === null || floor.imageHeight === null
    || !Number.isFinite(floor.imageWidth) || !Number.isFinite(floor.imageHeight)
    || floor.imageWidth <= 0 || floor.imageHeight <= 0) return null

  return floor as CompleteFloorGeoReference
}

/**
 * 基準点A・Bの8項目がすべて有限数として保存されている場合だけ、
 * ジオリファレンス設定済みと判定する。
 */
export function isGeoReferenced(floor: FloorGeoReferenceFields): boolean {
  return GEO_REFERENCE_FIELDS.every((field) => {
    const value = floor[field]
    return value !== null && Number.isFinite(value)
  })
}

export function getFloorCorners(floor: FloorGeoReferenceFields): FloorCorners | null {
  if (!isGeoReferenced(floor)) {
    try {
      return computeFallbackCorners(floor.imageWidth ?? 0, floor.imageHeight ?? 0)
    }
    catch {
      return null
    }
  }

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

function distanceMeters(from: LatLng, to: LatLng) {
  const radians = Math.PI / 180
  const fromLat = from.lat * radians
  const toLat = to.lat * radians
  const latDelta = (to.lat - from.lat) * radians
  const lngDelta = (to.lng - from.lng) * radians
  const haversine = Math.sin(latDelta / 2) ** 2
    + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)))
}

function getFloorAreaCenter(corners: FloorCorners): LatLng {
  const points = Object.values(corners)
  const radians = Math.PI / 180
  const averageSinLng = points.reduce((sum, point) => sum + Math.sin(point.lng * radians), 0)
  const averageCosLng = points.reduce((sum, point) => sum + Math.cos(point.lng * radians), 0)

  return {
    lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
    lng: Math.atan2(averageSinLng, averageCosLng) / radians,
  }
}

/**
 * フロア4隅を含む円へ許容マージンを加え、現在地が表示対象エリア内か判定する。
 */
export function isWithinFloorArea(
  userLat: number,
  userLng: number,
  corners: FloorCorners,
  marginMeters = AREA_MARGIN_METERS,
) {
  if (!isValidLatLng({ lat: userLat, lng: userLng })
    || !Number.isFinite(marginMeters) || marginMeters < 0) return false

  const center = getFloorAreaCenter(corners)
  const floorRadius = Math.max(
    ...Object.values(corners).map(corner => distanceMeters(center, corner)),
  )

  return distanceMeters(center, { lat: userLat, lng: userLng })
    <= floorRadius + marginMeters
}

export function isValidLatLng(value: LatLng) {
  return Number.isFinite(value.lat)
    && Number.isFinite(value.lng)
    && value.lat >= -90
    && value.lat <= 90
    && value.lng >= -180
    && value.lng <= 180
}
