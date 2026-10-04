import { updateSpotWithUsage } from '~~/server/utils/spot-usage'
import { pinConflict } from '~~/server/utils/pin-appearance'
import { spotPhotosSchema } from '~~/shared/schemas/photo'
import type { SpotPhotosResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<SpotPhotosResponse> => {
  const { spot, session } = await requireOwnedSpot(event)
  const body = await readBody(event)
  if (body.expectedVersion !== spot.liveVersion) throw pinConflict()
  const result = spotPhotosSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '写真の指定を確認してください。',
    })
  }

  const requestedIds = result.data.assetIds ?? result.data.photos.map(() => null)
  const uniqueIds = [...new Set(requestedIds.filter((id): id is string => id !== null))]
  const assets = uniqueIds.length
    ? await prisma.mediaAsset.findMany({ where: { id: { in: uniqueIds }, tenantId: session.user.tenantId } })
    : []
  if (assets.length !== uniqueIds.length) {
    throw createError({ statusCode: 422, statusMessage: '選択した登録画像が見つかりません。' })
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await updateSpotWithUsage(transaction, { where: { id: spot.id, liveVersion: body.expectedVersion }, data: { photosJson: result.data.photos, liveVersion: { increment: 1 } } })
      await transaction.spotPhoto.deleteMany({ where: { spotId: spot.id } })
      const managed = requestedIds.flatMap((assetId, order) => assetId ? [{ spotId: spot.id, assetId, order }] : [])
      if (managed.length) await transaction.spotPhoto.createMany({ data: managed })
    })
  }
  catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') throw pinConflict()
    throw error
  }

  return { photos: result.data.photos, assetIds: requestedIds, liveVersion: spot.liveVersion + 1 }
})
