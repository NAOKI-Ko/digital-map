import type { AdminMapResponse } from '~~/shared/types/map'

export default defineEventHandler(async (event): Promise<AdminMapResponse> => {
  const { map: accessibleMap, isOwner } = await requireMapAccess(event)

  const map = await prisma.map.findFirst({
    where: {
      id: accessibleMap.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      organizationName: true,
      logoUrl: true,
      logoAssetId: true,
      websiteUrl: true,
      snsUrl: true,
      isPublished: true,
      defaultLocale: true,
      enabledLocales: true,
      translations: { where: { locale: 'en' }, select: { name: true, description: true } },
      seoTitle: true,
      seoDescription: true,
      seoImageAssetId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { floors: true },
      },
    },
  })

  if (!map) {
    throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  }

  return {
    map: {
      id: map.id,
      name: map.name,
      slug: map.slug,
      organizationName: map.organizationName,
      logoUrl: map.logoUrl,
      logoAssetId: map.logoAssetId,
      websiteUrl: map.websiteUrl,
      snsUrl: map.snsUrl,
      isPublished: map.isPublished,
      defaultLocale: 'ja',
      enabledLocales: map.enabledLocales.filter((locale): locale is 'ja' | 'en' => locale === 'ja' || locale === 'en'),
      englishTranslation: map.translations[0] ?? null,
      seoTitle: map.seoTitle,
      seoDescription: map.seoDescription,
      seoImageAssetId: map.seoImageAssetId,
      floorCount: map._count.floors,
      createdAt: map.createdAt.toISOString(),
      updatedAt: map.updatedAt.toISOString(),
      permissions: { isOwner, canDelete: isOwner, canManageEditors: isOwner },
    },
  }
})
