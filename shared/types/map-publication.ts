export interface MapPublication {
  id: string
  name: string
  slug: string
  isPublished: boolean
  updatedAt: string
  releaseId?: string | null
}

export interface MapPublicationResponse {
  publication: MapPublication
}
