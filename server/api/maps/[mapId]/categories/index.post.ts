import { categoryCreateSchema } from '~~/shared/schemas/category'
import type { CategoryResponse } from '~~/shared/types/category'
import { toCategoryIconData } from '~~/server/utils/category-icon'
import { resolveTenantMediaAsset } from '~~/server/utils/media'

export default defineEventHandler(async (event): Promise<CategoryResponse> => {
  const { map, session } = await requireOwnedMap(event)
  const result = categoryCreateSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '入力内容を確認してください。' })

  const order = result.data.order ?? ((await prisma.category.aggregate({
    where: { mapId: map.id },
    _max: { order: true },
  }))._max.order ?? -1) + 1

  try {
    const asset = await resolveTenantMediaAsset(session.user.tenantId, result.data.iconAssetId, 'icon')
    const category = await prisma.category.create({
      data: {
        mapId: map.id,
        name: result.data.name,
        order,
        ...toCategoryIconData(result.data, map.id, asset),
      },
      include: { _count: { select: { spotCategories: true } } },
    })
    setResponseStatus(event, 201)
    return { category: toCategorySummary(category) }
  }
  catch (error) {
    if (isUniqueConstraintError(error)) throw createError({ statusCode: 409, statusMessage: '同じ名前のカテゴリーが既にあります。' })
    throw error
  }
})
