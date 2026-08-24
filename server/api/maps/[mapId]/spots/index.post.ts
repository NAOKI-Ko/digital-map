import { spotFormSchema } from '~~/shared/schemas/spot'
import type { AdminSpotResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<AdminSpotResponse> => {
  const { map } = await requireOwnedMap(event)
  const result = spotFormSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '入力内容を確認してください。',
    })
  }

  const floor = await prisma.mapFloor.findFirst({
    where: { id: result.data.floorId, mapId: map.id },
    select: { id: true },
  })
  if (!floor) {
    throw createError({ statusCode: 422, statusMessage: '選択したフロアが見つかりません。' })
  }

  const spot = await prisma.$transaction(async (transaction) => {
    const categories = await validateSpotCategories(transaction, map.id, result.data.categoryIds ?? [])
    const { categoryIds: _categoryIds, ...spotData } = result.data
    return transaction.spot.create({
      data: {
        ...spotData,
        description: spotData.description || null,
        hoursText: spotData.hoursText || null,
        holidayText: spotData.holidayText || null,
        phone: spotData.phone || null,
        spotCategories: { create: categories.map(category => ({ categoryId: category.id })) },
      },
      include: adminSpotInclude,
    })
  })

  setResponseStatus(event, 201)
  return {
    spot: toAdminSpotDetail(spot),
    floors: await getMapFloorOptions(map.id),
    categories: await getMapCategoryOptions(map.id),
  }
})
