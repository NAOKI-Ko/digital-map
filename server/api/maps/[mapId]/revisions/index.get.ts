export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const revisions = await prisma.spotRevision.findMany({
    where: { status: 'PENDING', spot: { floor: { mapId: map.id } } },
    include: { spot: { select: { id: true, name: true, liveVersion: true } }, author: { select: { email: true, displayName: true } }, photos: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })
  return { revisions }
})
