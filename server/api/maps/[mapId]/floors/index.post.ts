import { floorCreateSchema } from '~~/shared/schemas/floor'
import type { MapFloorResponse } from '~~/shared/types/floor'

export default defineEventHandler(async (event): Promise<MapFloorResponse> => {
  const { map } = await requireOwnedMap(event)
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
  const floor = await prisma.mapFloor.create({
    data: {
      mapId: map.id,
      name: result.data.name,
      illustrationUrl: result.data.illustrationUrl,
      isOutdoor: result.data.isOutdoor,
      order: (lastFloor?.order ?? -1) + 1,
    },
    include: { _count: { select: { spots: true } } },
  })

  setResponseStatus(event, 201)
  return { floor: toMapFloorItem(floor) }
})
