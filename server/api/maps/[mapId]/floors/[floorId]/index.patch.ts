import { floorUpdateSchema } from '~~/shared/schemas/floor'
import type { MapFloorResponse } from '~~/shared/types/floor'
import { resolveTenantMediaAsset } from '~~/server/utils/media'

export default defineEventHandler(async (event): Promise<MapFloorResponse> => {
  const { floor, session } = await requireOwnedFloor(event)
  const result = floorUpdateSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '入力内容を確認してください。',
    })
  }

  const asset = await resolveTenantMediaAsset(session.user.tenantId, result.data.illustrationAssetId)
  const { illustrationAssetId: _illustrationAssetId, ...input } = result.data
  const updatedFloor = await prisma.mapFloor.update({
    where: { id: floor.id },
    data: {
      ...input,
      ...(asset ? {
        illustrationUrl: asset.url,
        illustrationAssetId: asset.id,
        imageWidth: asset.width,
        imageHeight: asset.height,
      } : {}),
    },
    include: { _count: { select: { spots: true } } },
  })

  return { floor: toMapFloorItem(updatedFloor) }
})
