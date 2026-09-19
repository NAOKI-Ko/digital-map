import { mapCreateSchema } from '~~/shared/schemas/map'
import type { AdminMapResponse } from '~~/shared/types/map'
import { defaultSpotFieldDefinitions } from '~~/shared/constants/spot-fields'
import { assertTenantCanCreateMap, TenantAlreadyHasMapError } from '~~/server/utils/tenant-tourism-data'

export default defineEventHandler(async (event): Promise<AdminMapResponse> => {
  const { session } = await requireTenantOwner(event)
  const input = await readValidatedBody(event, mapCreateSchema.parse)
  let map
  try {
    map = await prisma.$transaction(async (transaction) => {
      await assertTenantCanCreateMap(transaction, session.user.tenantId)
      const created = await transaction.map.create({ data: {
        tenantId: session.user.tenantId,
        name: input.name,
        slug: input.slug,
        spotFieldDefinitions: { create: defaultSpotFieldDefinitions.map(field => ({ ...field })) },
      }, select: {
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
        } })
      await transaction.tenant.update({ where: { id: session.user.tenantId }, data: { onboardingState: 'ACTIVE' } })
      return created
    })
  }
  catch (error) {
    if (error instanceof TenantAlreadyHasMapError) {
      throw createError({ statusCode: 409, statusMessage: 'この組織には既にマップがあります。' })
    }
    throw error
  }

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
