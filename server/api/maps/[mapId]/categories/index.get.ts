import type { CategoryListResponse } from '~~/shared/types/category'

export default defineEventHandler(async (event): Promise<CategoryListResponse> => {
  const { map } = await requireOwnedMap(event)
  const categories = await prisma.category.findMany({
    where: { mapId: map.id },
    include: { _count: { select: { spotCategories: true } }, translations: { where: { locale: 'en' }, select: { name: true } } },
    orderBy: categoryOrderBy,
  })
  return { categories: categories.map(category => ({ ...toCategorySummary(category), englishName: category.translations[0]?.name ?? null })) }
})
