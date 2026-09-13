export interface UploadedImage {
  assetId: string
  url: string
  filename: string
  mimeType: 'image/png' | 'image/jpeg'
  size: number
  width: number
  height: number
}

export interface ImageUploadResponse {
  image: UploadedImage
}
