import { geoReferenceSchema } from '~~/shared/schemas/georeference'
import type { MapFloorResponse } from '~~/shared/types/floor'

export default defineEventHandler(async (event): Promise<MapFloorResponse> => {
  const { floor } = await requireOwnedFloor(event)
  const result = geoReferenceSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '矩形の範囲を確認してください。',
    })
  }

  const updatedFloor = await prisma.mapFloor.update({
    where: { id: floor.id },
    data: result.data,
    include: { _count: { select: { spots: true } } },
  })

  return { floor: toMapFloorItem(updatedFloor) }
})
