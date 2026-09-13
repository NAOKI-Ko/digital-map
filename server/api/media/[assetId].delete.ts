import { unlink } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import type { MediaAssetDeleteResponse } from '~~/shared/types/media'

export default defineEventHandler(async (event): Promise<MediaAssetDeleteResponse> => {
  const { asset } = await requireOwnedMediaAsset(event)
  const usage = summarizeMediaUsage(asset._count)
  if (usage.total > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `この画像は${usage.total}件で使用中のため削除できません。`,
      data: { usage },
    })
  }

  await prisma.mediaAsset.delete({ where: { id: asset.id } })
  if (basename(asset.storageKey) === asset.storageKey) {
    await unlink(resolve(getUploadDirectory(event), asset.storageKey)).catch((error) => {
      console.error('MediaAsset bytes could not be removed after metadata deletion.', error)
    })
  }
  return { deletedId: asset.id }
})
