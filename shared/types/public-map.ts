export interface PublicSpot {
  id: string
  floorId: string
  name: string
  category: string
  description: string | null
  lat: number
  lng: number
  photos: string[]
  hoursText: string | null
  holidayText: string | null
  phone: string | null
  pinIconType: 'preset' | 'custom'
  pinIconId: string | null
  pinIconImageUrl: string | null
  pinColor: string
}

export interface PublicFloor {
  id: string
  name: string
  illustrationUrl: string
  imageWidth: number | null
  imageHeight: number | null
  order: number
  refAPixelX: number | null
  refAPixelY: number | null
  refALat: number | null
  refALng: number | null
  refBPixelX: number | null
  refBPixelY: number | null
  refBLat: number | null
  refBLng: number | null
  isOutdoor: boolean
  spots: PublicSpot[]
}

export interface PublicMap {
  id: string
  name: string
  slug: string
  floors: PublicFloor[]
}

export interface PublicMapResponse {
  map: PublicMap
}
