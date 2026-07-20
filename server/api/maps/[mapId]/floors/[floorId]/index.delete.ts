export default defineEventHandler(async (event) => {
  const { map, floor } = await requireOwnedFloor(event)

  await prisma.$transaction(async (transaction) => {
    await transaction.mapFloor.delete({ where: { id: floor.id } })
    const remainingFloors = await transaction.mapFloor.findMany({
      where: { mapId: map.id },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    })

    await Promise.all(remainingFloors.map((remainingFloor, order) => transaction.mapFloor.update({
      where: { id: remainingFloor.id },
      data: { order },
    })))
  })

  return { ok: true }
})
