import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import type { ImageUploadResponse } from '~~/shared/types/upload'

export default defineEventHandler(async (event): Promise<ImageUploadResponse> => {
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename)

  if (!file) {
    throw createError({ statusCode: 400, statusMessage: '画像ファイルを選択してください。' })
  }

  const validated = validateImage(file.data, file.type, file.filename)
  const filename = `${randomUUID()}${validated.extension}`
  const uploadDirectory = getUploadDirectory(event)

  await mkdir(uploadDirectory, { recursive: true })
  await writeFile(`${uploadDirectory}/${filename}`, file.data, { flag: 'wx' })

  return {
    image: {
      url: `/uploads/${filename}`,
      filename,
      mimeType: validated.mimeType,
      size: file.data.length,
    },
  }
})
