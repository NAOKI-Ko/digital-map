import { mapNameSchema } from '~~/shared/schemas/map'
import type { AdminMapResponse } from '~~/shared/types/map'

export default defineEventHandler(async (event): Promise<AdminMapResponse> => {
  const session = await requireAdminSession(event)
  const input = await readValidatedBody(event, mapNameSchema.parse)
  const map = await prisma.map.create({
    data: {
      tenantId: session.user.tenantId,
      name: input.name,
      slug: createMapSlug(input.name),
    },
    select: {
      id: true,
      name: true,
      slug: true,
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
      isPublished: map.isPublished,
      floorCount: map._count.floors,
      createdAt: map.createdAt.toISOString(),
      updatedAt: map.updatedAt.toISOString(),
    },
  }
})
