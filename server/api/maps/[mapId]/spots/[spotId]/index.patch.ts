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

  if (ownedSpot.isPublished && (result.data.x === null || result.data.y === null)) {
    throw createError({
      statusCode: 422,
      statusMessage: '公開中のスポットから位置を削除できません。先に下書きへ戻してください。',
    })
  }

  const spot = await prisma.$transaction(async (transaction) => {
    const categories = result.data.categoryIds === undefined
      ? null
      : await validateSpotCategories(transaction, map.id, result.data.categoryIds)
    await validateSpotFieldSubmission(transaction, map.id, result.data, result.data.customValues, ownedSpot.id)
    const { categoryIds: _categoryIds, customValues, ...spotData } = result.data
    const updated = await transaction.spot.update({
      where: { id: ownedSpot.id },
      data: {
        liveVersion: { increment: 1 },
        ...spotData,
        description: spotData.description || null,
        address: spotData.address || null,
        website: spotData.website || null,
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
    for (const [fieldDefinitionId, value] of Object.entries(customValues)) {
      if (value === null || value === '') {
        await transaction.spotFieldValue.deleteMany({ where: { spotId: ownedSpot.id, fieldDefinitionId } })
      }
      else {
        await transaction.spotFieldValue.upsert({
          where: { spotId_fieldDefinitionId: { spotId: ownedSpot.id, fieldDefinitionId } },
          create: { spotId: ownedSpot.id, fieldDefinitionId, valueJson: value },
          update: { valueJson: value },
        })
      }
    }
    return updated
  })

  return {
    spot: toAdminSpotDetail(spot),
    floors: await getMapFloorOptions(map.id),
    categories: await getMapCategoryOptions(map.id),
    fields: await getMapSpotFieldDefinitions(map.id),
  }
})
