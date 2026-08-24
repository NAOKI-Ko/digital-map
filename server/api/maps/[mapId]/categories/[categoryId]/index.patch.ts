import { categoryUpdateSchema } from '~~/shared/schemas/category'
import type { CategoryResponse } from '~~/shared/types/category'

export default defineEventHandler(async (event): Promise<CategoryResponse> => {
  const { map } = await requireOwnedMap(event)
  const ownedCategory = await requireOwnedCategory(map.id, getRouterParam(event, 'categoryId'))
  const result = categoryUpdateSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '入力内容を確認してください。' })

  try {
    const category = await prisma.category.update({
      where: { id: ownedCategory.id },
      data: result.data,
      include: { _count: { select: { spotCategories: true } } },
    })
    return { category: toCategorySummary(category) }
  }
  catch (error) {
    if (isUniqueConstraintError(error)) throw createError({ statusCode: 409, statusMessage: '同じ名前のカテゴリーが既にあります。' })
    throw error
  }
})
