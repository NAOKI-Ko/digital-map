export interface UploadedImage {
  url: string
  filename: string
  mimeType: 'image/png' | 'image/jpeg'
  size: number
}

export interface ImageUploadResponse {
  image: UploadedImage
}
