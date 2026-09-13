import { spotBulkSchema } from '~~/shared/schemas/spot-bulk'
import type { SpotBulkResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<SpotBulkResponse> => {
  const { map } = await requireOwnedMap(event)
  const result = spotBulkSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '一括操作の内容を確認してください。' })

  const input = result.data
  const spotIds = [...new Set(input.spotIds)]
  const categoryIds = input.action === 'setCategories' ? input.categoryIds : null
  const spots = await prisma.spot.findMany({
    where: { id: { in: spotIds }, floor: { mapId: map.id } },
    select: { id: true, x: true, y: true },
  })
  if (spots.length !== spotIds.length) throw createError({ statusCode: 404, statusMessage: '選択したスポットが見つかりません。' })
  if (input.action === 'publish' && spots.some(spot => spot.x === null || spot.y === null)) {
    throw createError({ statusCode: 422, statusMessage: '位置未設定のスポットは公開できません。' })
  }

  await prisma.$transaction(async (transaction) => {
    if (input.action === 'delete') {
      await transaction.spot.deleteMany({ where: { id: { in: spotIds }, floor: { mapId: map.id } } })
      return
    }
    if (input.action === 'publish' || input.action === 'unpublish') {
      await transaction.spot.updateMany({ where: { id: { in: spotIds }, floor: { mapId: map.id } }, data: { isPublished: input.action === 'publish' } })
      return
    }
    if (categoryIds === null) return
    const categories = await validateSpotCategories(transaction, map.id, categoryIds)
    await transaction.spotCategory.deleteMany({ where: { spotId: { in: spotIds } } })
    if (categories.length) {
      await transaction.spotCategory.createMany({
        data: spotIds.flatMap(spotId => categories.map(category => ({ spotId, categoryId: category.id }))),
      })
    }
  })

  return { updatedCount: spotIds.length }
})
