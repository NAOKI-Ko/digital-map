import type { H3Event } from 'h3'

export async function requireMapAccess(event: H3Event) {
  const session = await requireUser(event)
  const mapId = getRouterParam(event, 'mapId')

  if (!mapId) {
    throw createError({ statusCode: 400, statusMessage: 'マップIDが必要です。' })
  }

  const map = await prisma.map.findUnique({
    where: { id: mapId },
    select: { id: true, name: true, tenantId: true },
  })

  if (!map) {
    throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  }

  const membership = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: map.tenantId, userId: session.user.id } },
  })
  if (!membership || map.tenantId !== session.user.tenantId) {
    throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  }
  if (membership.role !== 'OWNER') {
    const assignment = await prisma.mapMember.findUnique({
      where: { mapId_userId: { mapId: map.id, userId: session.user.id } },
    })
    if (!assignment || assignment.role !== 'EDITOR') {
      throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
    }
  }
  return { session, map, membership, isOwner: membership.role === 'OWNER' }
}

export const requireMapEditorOrOwner = requireMapAccess
export const requireOwnedMap = requireMapAccess

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
    select: { id: true, mapId: true, order: true, imageWidth: true, imageHeight: true },
  })

  if (!floor) {
    throw createError({ statusCode: 404, statusMessage: 'フロアが見つかりません。' })
  }

  return { session, map, floor }
}

export async function requireOwnedSpot(event: H3Event) {
  const { session, map, isOwner } = await requireOwnedMap(event)
  const spotId = getRouterParam(event, 'spotId')

  if (!spotId) {
    throw createError({ statusCode: 400, statusMessage: 'スポットIDが必要です。' })
  }

  const spot = await prisma.spot.findFirst({
    where: {
      id: spotId,
      floor: { mapId: map.id },
    },
    select: { id: true, floorId: true, x: true, y: true, isPublished: true },
  })

  if (!spot) {
    throw createError({ statusCode: 404, statusMessage: 'スポットが見つかりません。' })
  }

  return { session, map, spot, isOwner }
}
