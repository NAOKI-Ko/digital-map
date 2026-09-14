import { createHash, randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { ImageUploadResponse } from '~~/shared/types/upload'
import { processMediaAsset } from '~~/server/utils/media-variants'

export default defineEventHandler(async (event): Promise<ImageUploadResponse> => {
  const { map, session } = await requireOwnedMap(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: '画像ファイルを選択してください。' })

  const validated = validateImage(file.data, file.type, file.filename)
  const dimensions = readImageDimensions(file.data, validated.mimeType)
  const filename = `category-icon-${map.id}--${randomUUID()}${validated.extension}`
  const uploadDirectory = getUploadDirectory(event)

  await mkdir(uploadDirectory, { recursive: true })
  await writeFile(resolve(uploadDirectory, filename), file.data, { flag: 'wx' })

  try {
    const asset = await prisma.mediaAsset.create({
      data: {
        tenantId: session.user.tenantId,
        storageKey: filename,
        originalFilename: file.filename ?? filename,
        mimeType: validated.mimeType,
        width: dimensions.width,
        height: dimensions.height,
        fileSize: file.data.length,
        sha256: createHash('sha256').update(file.data).digest('hex'),
      },
    })
    const processing = await processMediaAsset(prisma, asset, uploadDirectory)
    return {
      image: {
        assetId: asset.id,
        url: `/uploads/${filename}`,
        filename,
        mimeType: validated.mimeType,
        size: file.data.length,
        width: dimensions.width,
        height: dimensions.height,
        processingStatus: processing.status,
      },
    }
  }
  catch (error) {
    await unlink(resolve(uploadDirectory, filename)).catch(() => undefined)
    throw error
  }
})
