import { floorCreateSchema } from '~~/shared/schemas/floor'
import type { MapFloorResponse } from '~~/shared/types/floor'
import { resolveTenantMediaAsset } from '~~/server/utils/media'

export default defineEventHandler(async (event): Promise<MapFloorResponse> => {
  const { map, session } = await requireOwnedMap(event)
  const result = floorCreateSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '入力内容を確認してください。',
    })
  }

  const lastFloor = await prisma.mapFloor.findFirst({
    where: { mapId: map.id },
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  const asset = await resolveTenantMediaAsset(session.user.tenantId, result.data.illustrationAssetId, 'floor')
  const floor = await prisma.mapFloor.create({
    data: {
      mapId: map.id,
      name: result.data.name,
      illustrationUrl: asset?.url ?? result.data.illustrationUrl,
      illustrationAssetId: asset?.id,
      imageWidth: asset?.width ?? result.data.imageWidth,
      imageHeight: asset?.height ?? result.data.imageHeight,
      order: (lastFloor?.order ?? -1) + 1,
    },
    include: { _count: { select: { spots: true } } },
  })

  setResponseStatus(event, 201)
  return { floor: toMapFloorItem(floor) }
})
