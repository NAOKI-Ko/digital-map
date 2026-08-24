import { mapBrandingSchema } from '~~/shared/schemas/map'
import type { MapBrandingResponse } from '~~/shared/types/map'

export default defineEventHandler(async (event): Promise<MapBrandingResponse> => {
  const { map } = await requireOwnedMap(event)
  const input = await readValidatedBody(event, mapBrandingSchema.parse)
  const branding = await prisma.map.update({
    where: { id: map.id },
    data: input,
    select: {
      organizationName: true,
      logoUrl: true,
      websiteUrl: true,
      snsUrl: true,
    },
  })

  return { branding }
})
