import { mapBrandingSchema } from '~~/shared/schemas/map'
import type { MapBrandingResponse } from '~~/shared/types/map'
import { resolveTenantMediaAsset } from '~~/server/utils/media'

export default defineEventHandler(async (event): Promise<MapBrandingResponse> => {
  const { map, session } = await requireOwnedMap(event)
  const input = await readValidatedBody(event, mapBrandingSchema.parse)
  const asset = await resolveTenantMediaAsset(session.user.tenantId, input.logoAssetId)
  const branding = await prisma.map.update({
    where: { id: map.id },
    data: {
      ...input,
      ...(asset ? { logoAssetId: asset.id, logoUrl: asset.url } : {}),
    },
    select: {
      organizationName: true,
      logoUrl: true,
      logoAssetId: true,
      websiteUrl: true,
      snsUrl: true,
    },
  })

  return { branding }
})
