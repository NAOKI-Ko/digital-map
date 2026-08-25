export interface CategorySummary {
  id: string
  mapId: string
  name: string
  order: number
  iconType: string | null
  iconPresetId: string | null
  iconImageUrl: string | null
  spotCount: number
}

export interface SpotCategorySummary {
  id: string
  name: string
  order: number
  iconType: string | null
  iconPresetId: string | null
  iconImageUrl: string | null
}

export interface CategoryListResponse {
  categories: CategorySummary[]
}

export interface CategoryResponse {
  category: CategorySummary
}
