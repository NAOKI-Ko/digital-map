export interface GeocodeResult {
  id: string
  displayName: string
  lat: number
  lng: number
  category: string | null
  type: string | null
}

export interface GeocodeResponse {
  results: GeocodeResult[]
}
