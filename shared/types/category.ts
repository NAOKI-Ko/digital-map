export interface CategorySummary {
  id: string
  mapId: string
  name: string
  order: number
  spotCount: number
}

export interface SpotCategorySummary {
  id: string
  name: string
  order: number
}

export interface CategoryListResponse {
  categories: CategorySummary[]
}

export interface CategoryResponse {
  category: CategorySummary
}
