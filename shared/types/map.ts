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
  permissions: { canCreateMap: boolean, isOwner: boolean }
}

export interface AdminMapDetail extends AdminMapSummary {
  organizationName: string | null
  logoUrl: string | null
  logoAssetId?: string | null
  websiteUrl: string | null
  snsUrl: string | null
  createdAt: string
  permissions?: { isOwner: boolean, canDelete: boolean, canManageEditors: boolean }
}

export interface AdminMapResponse {
  map: AdminMapDetail
}

export interface MapBrandingResponse {
  branding: Pick<AdminMapDetail, 'organizationName' | 'logoUrl' | 'logoAssetId' | 'websiteUrl' | 'snsUrl'>
}
