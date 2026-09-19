import { categoryUpdateSchema } from '~~/shared/schemas/category'
import type { CategoryResponse } from '~~/shared/types/category'
import { toCategoryIconData } from '~~/server/utils/category-icon'
import { resolveTenantMediaAsset } from '~~/server/utils/media'

export default defineEventHandler(async (event): Promise<CategoryResponse> => {
  const { map, session } = await requireOwnedMap(event)
  const ownedCategory = await requireOwnedCategory(map.id, map.tenantId, getRouterParam(event, 'categoryId'))
  const result = categoryUpdateSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '入力内容を確認してください。' })

  try {
    const asset = await resolveTenantMediaAsset(session.user.tenantId, result.data.iconAssetId, 'icon')
    const category = await prisma.category.update({
      where: { id: ownedCategory.id },
      data: {
        ...(result.data.name === undefined ? {} : { name: result.data.name }),
        ...(result.data.order === undefined ? {} : { order: result.data.order }),
        ...toCategoryIconData(result.data, map.id, asset),
      },
      include: { _count: { select: { spotCategories: true } } },
    })
    return { category: toCategorySummary(category) }
  }
  catch (error) {
    if (isUniqueConstraintError(error)) throw createError({ statusCode: 409, statusMessage: '同じ名前のカテゴリーが既にあります。' })
    throw error
  }
})
