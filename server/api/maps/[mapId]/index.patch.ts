import { mapNameSchema } from '~~/shared/schemas/map'
import type { AdminMapResponse } from '~~/shared/types/map'

export default defineEventHandler(async (event): Promise<AdminMapResponse> => {
  const session = await requireAdminSession(event)
  const mapId = getRouterParam(event, 'mapId')
  const input = await readValidatedBody(event, mapNameSchema.parse)

  if (!mapId) {
    throw createError({ statusCode: 400, statusMessage: 'マップIDが必要です。' })
  }

  const ownedMap = await prisma.map.findFirst({
    where: {
      id: mapId,
      tenantId: session.user.tenantId,
    },
    select: { id: true },
  })

  if (!ownedMap) {
    throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  }

  const map = await prisma.map.update({
    where: { id: ownedMap.id },
    data: { name: input.name },
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
