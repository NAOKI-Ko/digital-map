import type { AdminSpotResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<AdminSpotResponse> => {
  const { map, spot: ownedSpot } = await requireOwnedSpot(event)
  const spot = await prisma.spot.findUniqueOrThrow({
    where: { id: ownedSpot.id },
    include: adminSpotInclude,
  })

  return {
    spot: toAdminSpotDetail(spot),
    floors: await getMapFloorOptions(map.id),
  }
})
