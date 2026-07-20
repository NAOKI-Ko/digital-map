export interface AdminMapSummary {
  id: string
  name: string
  slug: string
  isPublished: boolean
  floorCount: number
  updatedAt: string
}

export interface AdminMapListResponse {
  maps: AdminMapSummary[]
}
