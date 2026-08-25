import type { Prisma } from '~~/prisma/generated/client'

export const categoryOrderBy = [
  { order: 'asc' as const },
  { name: 'asc' as const },
]

export const spotCategorySelect = {
  category: {
    select: { id: true, name: true, order: true, iconType: true, iconPresetId: true, iconImageUrl: true },
  },
} satisfies Prisma.SpotCategorySelect

export function sortSpotCategories<T extends { name: string, order: number }>(categories: T[]) {
  return categories.toSorted((left, right) => left.order - right.order || left.name.localeCompare(right.name, 'ja'))
}

export async function validateSpotCategories(
  client: Prisma.TransactionClient,
  mapId: string,
  categoryIds: readonly string[],
) {
  const uniqueIds = [...new Set(categoryIds)]
  if (uniqueIds.length === 0) return []

  const categories = await client.category.findMany({
    where: { id: { in: uniqueIds }, mapId },
    select: { id: true, name: true, order: true, iconType: true, iconPresetId: true, iconImageUrl: true },
    orderBy: categoryOrderBy,
  })
  if (categories.length !== uniqueIds.length) {
    throw createError({ statusCode: 422, statusMessage: '選択したカテゴリーが見つかりません。' })
  }
  return categories
}

export async function requireOwnedCategory(mapId: string, categoryId: string | undefined) {
  if (!categoryId) throw createError({ statusCode: 400, statusMessage: 'カテゴリーIDが必要です。' })
  const category = await prisma.category.findFirst({
    where: { id: categoryId, mapId },
    include: { _count: { select: { spotCategories: true } } },
  })
  if (!category) throw createError({ statusCode: 404, statusMessage: 'カテゴリーが見つかりません。' })
  return category
}

export function toCategorySummary(category: {
  id: string
  mapId: string
  name: string
  order: number
  iconType: string | null
  iconPresetId: string | null
  iconImageUrl: string | null
  _count: { spotCategories: number }
}) {
  return {
    id: category.id,
    mapId: category.mapId,
    name: category.name,
    order: category.order,
    iconType: category.iconType === 'preset' || category.iconType === 'custom' ? category.iconType : null,
    iconPresetId: category.iconPresetId,
    iconImageUrl: category.iconImageUrl,
    spotCount: category._count.spotCategories,
  }
}

export function isUniqueConstraintError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}
