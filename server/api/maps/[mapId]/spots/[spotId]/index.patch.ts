import { spotFormSchema } from '~~/shared/schemas/spot'
import type { AdminSpotResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<AdminSpotResponse> => {
  const { map, spot: ownedSpot } = await requireOwnedSpot(event)
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

  if (ownedSpot.isPublished && (result.data.lat === null || result.data.lng === null)) {
    throw createError({
      statusCode: 422,
      statusMessage: '公開中のスポットから位置を削除できません。先に下書きへ戻してください。',
    })
  }

  const spot = await prisma.$transaction(async (transaction) => {
    const categories = result.data.categoryIds === undefined
      ? null
      : await validateSpotCategories(transaction, map.id, result.data.categoryIds)
    const { categoryIds: _categoryIds, ...spotData } = result.data
    return transaction.spot.update({
      where: { id: ownedSpot.id },
      data: {
        ...spotData,
        description: spotData.description || null,
        hoursText: spotData.hoursText || null,
        holidayText: spotData.holidayText || null,
        phone: spotData.phone || null,
        ...(categories === null ? {} : {
          spotCategories: {
            deleteMany: {},
            create: categories.map(category => ({ categoryId: category.id })),
          },
        }),
      },
      include: adminSpotInclude,
    })
  })

  return {
    spot: toAdminSpotDetail(spot),
    floors: await getMapFloorOptions(map.id),
    categories: await getMapCategoryOptions(map.id),
  }
})
