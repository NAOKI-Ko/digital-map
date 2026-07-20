import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename') ?? ''
  const mimeType = mimeTypeForFilename(filename)

  if (!mimeType || basename(filename) !== filename || !/^[0-9a-f-]+\.(?:png|jpg)$/.test(filename)) {
    throw createError({ statusCode: 404, statusMessage: '画像が見つかりません。' })
  }

  try {
    const image = await readFile(join(getUploadDirectory(event), filename))
    setHeader(event, 'Content-Type', mimeType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    return image
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: '画像が見つかりません。' })
  }
})
