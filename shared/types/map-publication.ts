export interface MapPublication {
  id: string
  name: string
  slug: string
  isPublished: boolean
  updatedAt: string
}

export interface MapPublicationResponse {
  publication: MapPublication
}
