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
  order: number
  topLeftLat: number | null
  topLeftLng: number | null
  bottomRightLat: number | null
  bottomRightLng: number | null
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
