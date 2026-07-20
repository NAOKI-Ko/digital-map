import { floorReorderSchema } from '~~/shared/schemas/floor'

export default defineEventHandler(async (event) => {
  const { map } = await requireOwnedMap(event)
  const result = floorReorderSchema.safeParse(await readBody(event))

  if (!result.success || new Set(result.data.floorIds).size !== result.data.floorIds.length) {
    throw createError({ statusCode: 422, statusMessage: '並び順の指定が不正です。' })
  }

  const existingFloors = await prisma.mapFloor.findMany({
    where: { mapId: map.id },
    select: { id: true },
  })
  const existingIds = new Set(existingFloors.map(floor => floor.id))

  if (existingIds.size !== result.data.floorIds.length || result.data.floorIds.some(id => !existingIds.has(id))) {
    throw createError({ statusCode: 422, statusMessage: '全フロアを含む並び順を指定してください。' })
  }

  await prisma.$transaction(
    result.data.floorIds.map((id, order) => prisma.mapFloor.update({
      where: { id },
      data: { order },
    })),
  )

  return { ok: true }
})
