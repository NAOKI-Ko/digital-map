import { floorUpdateSchema } from '~~/shared/schemas/floor'
import type { MapFloorResponse } from '~~/shared/types/floor'

export default defineEventHandler(async (event): Promise<MapFloorResponse> => {
  const { floor } = await requireOwnedFloor(event)
  const result = floorUpdateSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '入力内容を確認してください。',
    })
  }

  const updatedFloor = await prisma.mapFloor.update({
    where: { id: floor.id },
    data: {
      name: result.data.name,
      isOutdoor: result.data.isOutdoor,
    },
    include: { _count: { select: { spots: true } } },
  })

  return { floor: toMapFloorItem(updatedFloor) }
})
