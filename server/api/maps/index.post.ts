import { mapCreateSchema } from '~~/shared/schemas/map'
import type { AdminMapResponse } from '~~/shared/types/map'
import { lockTenantMapCreation } from '~~/server/utils/tenant-tourism-data'
import { ensureDefaultSpotFieldDefinitions } from '~~/server/utils/spot-field'

export default defineEventHandler(async (event): Promise<AdminMapResponse> => {
  const { session } = await requireTenantOwner(event)
  const input = await readValidatedBody(event, mapCreateSchema.parse)
  const map = await prisma.$transaction(async (transaction) => {
      await lockTenantMapCreation(transaction, session.user.tenantId)
      const created = await transaction.map.create({ data: {
        tenantId: session.user.tenantId,
        name: input.name,
        slug: input.slug,
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
      await ensureDefaultSpotFieldDefinitions(transaction, created.id)
      await transaction.tenant.update({ where: { id: session.user.tenantId }, data: { onboardingState: 'ACTIVE' } })
      return created
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
