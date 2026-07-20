import { extname, resolve } from 'node:path'
import type { H3Event } from 'h3'

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024

const allowedFiles = {
  'image/png': {
    extension: '.png',
    isValid: (data: Buffer) => data.length >= 8
      && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/jpeg': {
    extension: '.jpg',
    isValid: (data: Buffer) => data.length >= 3
      && data[0] === 0xff
      && data[1] === 0xd8
      && data[2] === 0xff,
  },
} as const

export type AllowedImageMimeType = keyof typeof allowedFiles

export function getUploadDirectory(event?: H3Event) {
  const configuredDirectory = event ? useRuntimeConfig(event).uploadDir : ''

  if (configuredDirectory) {
    return resolve(configuredDirectory)
  }

  return resolve(
    process.cwd(),
    process.env.NODE_ENV === 'production' ? '.output/public/uploads' : 'public/uploads',
  )
}

export function validateImage(data: Buffer, mimeType?: string, originalName?: string) {
  if (!mimeType || !(mimeType in allowedFiles)) {
    throw createError({
      statusCode: 415,
      statusMessage: 'PNGまたはJPEG画像を選択してください。',
    })
  }

  if (data.length === 0 || data.length > MAX_IMAGE_SIZE) {
    throw createError({
      statusCode: 413,
      statusMessage: '画像は10MB以下にしてください。',
    })
  }

  const typedMimeType = mimeType as AllowedImageMimeType
  const definition = allowedFiles[typedMimeType]
  const originalExtension = extname(originalName ?? '').toLowerCase()
  const allowedExtensions = typedMimeType === 'image/png' ? ['.png'] : ['.jpg', '.jpeg']

  if (!definition.isValid(data) || (originalExtension && !allowedExtensions.includes(originalExtension))) {
    throw createError({
      statusCode: 415,
      statusMessage: '画像ファイルの形式を確認してください。',
    })
  }

  return {
    mimeType: typedMimeType,
    extension: definition.extension,
  }
}

export function mimeTypeForFilename(filename: string) {
  const extension = extname(filename).toLowerCase()

  if (extension === '.png') {
    return 'image/png'
  }

  if (extension === '.jpg') {
    return 'image/jpeg'
  }

  return null
}
