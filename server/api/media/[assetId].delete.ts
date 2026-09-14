import { unlink } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import type { MediaAssetDeleteResponse } from '~~/shared/types/media'
import { requireOwnedMediaAsset, summarizeMediaUsage } from '~~/server/utils/media'

export default defineEventHandler(async (event): Promise<MediaAssetDeleteResponse> => {
  const { asset, session } = await requireOwnedMediaAsset(event)
  const usage = summarizeMediaUsage(asset._count)
  if (usage.total > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `この画像は${usage.total}件で使用中のため削除できません。`,
      data: { usage },
    })
  }

  await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.delete({ where: { id: asset.id } })
    await appendAuditEvent(tx, { tenantId: asset.tenantId, actorUserId: session.user.id, action: 'MEDIA_ASSET_PHYSICALLY_DELETED', targetType: 'MediaAsset', targetId: asset.id, metadata: { usageCount: usage.total } })
  })
  for (const storageKey of [asset.storageKey, ...(asset.variants ?? []).map(variant => variant.storageKey)]) if (basename(storageKey) === storageKey) {
    await unlink(resolve(getUploadDirectory(event), storageKey)).catch((error) => {
      console.error('MediaAsset bytes could not be removed after metadata deletion.', error)
    })
  }
  return { deletedId: asset.id }
})
