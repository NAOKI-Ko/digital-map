import { categoryPinAppearance } from '~~/shared/utils/pin-appearance'
import { pinDependentsVersion } from '~~/server/utils/pin-appearance'
export default defineEventHandler(async (event) => {
  const { map } = await requireOwnedMap(event)
  const categoryId = getRouterParam(event, 'categoryId')
  return prisma.$transaction(async tx => {
    const category = await tx.category.findFirst({ where: { id: categoryId, mapId: map.id, tenantId: map.tenantId } })
    if (!category) throw createError({ statusCode: 404, statusMessage: 'カテゴリーが見つかりません。' })
    const spots = await tx.spot.findMany({
      where: { pinSourceCategoryId: category.id, pinSourceMode: 'category', tenantId: map.tenantId, mapUsage: { mapId: map.id } },
      select: { id: true, name: true, liveVersion: true, floor: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    })
    return { design: categoryPinAppearance(category), revision: category.pinDefaultRevision, dependentsVersion: pinDependentsVersion(spots), spots }
  }, { isolationLevel: 'RepeatableRead' })
})
