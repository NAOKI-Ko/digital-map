import { mapNameSchema } from '~~/shared/schemas/map'
import type { AdminMapResponse } from '~~/shared/types/map'

export default defineEventHandler(async (event): Promise<AdminMapResponse> => {
  const { map: accessibleMap, isOwner } = await requireMapAccess(event)
  const input = await readValidatedBody(event, mapNameSchema.parse)

  const map = await prisma.map.update({
    where: { id: accessibleMap.id },
    data: { name: input.name },
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
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { floors: true },
      },
    },
  })

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
      enabledLocales: ['ja'],
      englishTranslation: null,
      floorCount: map._count.floors,
      createdAt: map.createdAt.toISOString(),
      updatedAt: map.updatedAt.toISOString(),
      permissions: { isOwner, canDelete: isOwner, canManageEditors: isOwner },
    },
  }
})
