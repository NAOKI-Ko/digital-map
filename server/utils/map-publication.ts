import { prisma } from './prisma'

export async function setOwnedMapPublication(
  mapId: string,
  tenantId: string,
  isPublished: boolean,
) {
  const ownedMap = await prisma.map.findFirst({
    where: { id: mapId, tenantId },
    select: { id: true },
  })

  if (!ownedMap) return null

  return prisma.map.update({
    where: { id: ownedMap.id },
    data: { isPublished },
    select: {
      id: true,
      name: true,
      slug: true,
      isPublished: true,
      updatedAt: true,
    },
  })
}
