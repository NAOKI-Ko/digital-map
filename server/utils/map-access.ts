import type { H3Event } from 'h3'

export async function requireOwnedMap(event: H3Event) {
  const session = await requireAdminSession(event)
  const mapId = getRouterParam(event, 'mapId')

  if (!mapId) {
    throw createError({ statusCode: 400, statusMessage: 'マップIDが必要です。' })
  }

  const map = await prisma.map.findFirst({
    where: {
      id: mapId,
      tenantId: session.user.tenantId,
    },
    select: { id: true, name: true },
  })

  if (!map) {
    throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  }

  return { session, map }
}

export async function requireOwnedFloor(event: H3Event) {
  const { session, map } = await requireOwnedMap(event)
  const floorId = getRouterParam(event, 'floorId')

  if (!floorId) {
    throw createError({ statusCode: 400, statusMessage: 'フロアIDが必要です。' })
  }

  const floor = await prisma.mapFloor.findFirst({
    where: {
      id: floorId,
      mapId: map.id,
    },
    select: { id: true, mapId: true, order: true },
  })

  if (!floor) {
    throw createError({ statusCode: 404, statusMessage: 'フロアが見つかりません。' })
  }

  return { session, map, floor }
}

export async function requireOwnedSpot(event: H3Event) {
  const { session, map } = await requireOwnedMap(event)
  const spotId = getRouterParam(event, 'spotId')

  if (!spotId) {
    throw createError({ statusCode: 400, statusMessage: 'スポットIDが必要です。' })
  }

  const spot = await prisma.spot.findFirst({
    where: {
      id: spotId,
      floor: { mapId: map.id },
    },
    select: { id: true, floorId: true },
  })

  if (!spot) {
    throw createError({ statusCode: 404, statusMessage: 'スポットが見つかりません。' })
  }

  return { session, map, spot }
}
