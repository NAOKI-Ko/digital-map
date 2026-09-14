import { mapCreateSchema } from '~~/shared/schemas/map'
import type { AdminMapResponse } from '~~/shared/types/map'
import { defaultSpotFieldDefinitions } from '~~/shared/constants/spot-fields'

export default defineEventHandler(async (event): Promise<AdminMapResponse> => {
  const { session } = await requireTenantOwner(event)
  const input = await readValidatedBody(event, mapCreateSchema.parse)
  const map = await prisma.map.create({
    data: {
      tenantId: session.user.tenantId,
      name: input.name,
      slug: input.slug,
      spotFieldDefinitions: { create: defaultSpotFieldDefinitions.map(field => ({ ...field })) },
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
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { floors: true },
      },
    },
  })

  setResponseStatus(event, 201)

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
    },
  }
})
