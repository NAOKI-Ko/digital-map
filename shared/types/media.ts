export interface MediaAssetUsage {
  mapLogos: number
  floorIllustrations: number
  categoryIcons: number
  spotPins: number
  spotPhotos: number
  revisionPhotos: number
  decorations: number
  tenantLogos: number
  total: number
}

export interface MediaAssetItem {
  id: string
  url: string
  originalFilename: string
  mimeType: string
  width: number
  height: number
  fileSize: number
  sha256: string | null
  createdAt: string
  usage: MediaAssetUsage
  usedInMapIds: string[]
}

export interface MediaAssetListResponse {
  assets: MediaAssetItem[]
}

export interface MediaAssetDeleteResponse {
  deletedId: string
}
