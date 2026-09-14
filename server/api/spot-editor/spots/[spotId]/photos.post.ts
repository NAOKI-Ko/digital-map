import { createHash, randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'

export default defineEventHandler(async (event) => {
  const spotId = getRouterParam(event, 'spotId')
  if (!spotId) throw createError({ statusCode: 400, statusMessage: 'スポットIDが必要です。' })
  const { map } = await requireAssignedSpotEditor(event, spotId)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: '画像ファイルを選択してください。' })
  const validated = validateImage(file.data, file.type, file.filename)
  const dimensions = readImageDimensions(file.data, validated.mimeType)
  const filename = `${randomUUID()}${validated.extension}`
  const uploadDirectory = getUploadDirectory(event)
  await mkdir(uploadDirectory, { recursive: true })
  await writeFile(`${uploadDirectory}/${filename}`, file.data, { flag: 'wx' })
  try {
    const asset = await prisma.mediaAsset.create({ data: {
      tenantId: map.tenantId, storageKey: filename, originalFilename: sanitizeOriginalFilename(file.filename ?? filename),
      mimeType: validated.mimeType, width: dimensions.width, height: dimensions.height,
      fileSize: file.data.length, sha256: createHash('sha256').update(file.data).digest('hex'),
    } })
    return { image: { assetId: asset.id, url: `/uploads/${filename}`, ...dimensions, mimeType: validated.mimeType, size: file.data.length, filename } }
  }
  catch (error) { await unlink(`${uploadDirectory}/${filename}`).catch(() => undefined); throw error }
})
