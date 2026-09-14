import { prisma } from './prisma'
import { appendAuditEvent } from './audit'

export async function setOwnedMapPublication(
  mapId: string,
  tenantId: string,
  isPublished: boolean,
  actorUserId?: string,
) {
  const ownedMap = await prisma.map.findFirst({
    where: { id: mapId, tenantId },
    select: { id: true },
  })

  if (!ownedMap) return null

  return prisma.$transaction(async (tx) => {
    const updated = await tx.map.update({ where: { id: ownedMap.id }, data: { isPublished }, select: { id: true, name: true, slug: true, isPublished: true, updatedAt: true } })
    await appendAuditEvent(tx, { tenantId, actorUserId, action: isPublished ? 'MAP_PUBLISHED' : 'MAP_UNPUBLISHED', targetType: 'Map', targetId: mapId, mapId, metadata: { isPublished } })
    return updated
  })
}
