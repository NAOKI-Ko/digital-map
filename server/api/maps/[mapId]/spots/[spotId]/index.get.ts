import type { AdminSpotResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<AdminSpotResponse> => {
  const { map, spot: ownedSpot } = await requireOwnedSpot(event)
  const spot = await prisma.spot.findUniqueOrThrow({
    where: { id: ownedSpot.id },
    include: adminSpotInclude,
  })

  return {
    spot: {
      ...toAdminSpotDetail(spot),
      enabledLocales: (await prisma.map.findUniqueOrThrow({ where: { id: map.id }, select: { enabledLocales: true } })).enabledLocales.filter((locale): locale is 'ja' | 'en' => locale === 'ja' || locale === 'en'),
    },
    floors: await getMapFloorOptions(map.id),
    categories: await getMapCategoryOptions(map.id),
    fields: await getMapSpotFieldDefinitions(map.id),
  }
})
