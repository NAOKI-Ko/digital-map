import { updateLegacySpot } from '~~/server/utils/spot-usage'
import type { SpotPositionResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<SpotPositionResponse> => {
  const { spot } = await requireOwnedSpot(event)
  const otherPositioned = await prisma.illustrationPlacement.count({ where: { usage: { spotId: spot.id }, isPrimary: false, x: { not: null }, y: { not: null } } })
  await updateLegacySpot({
    where: { id: spot.id },
    data: { x: null, y: null, isPublished: Boolean(otherPositioned && spot.isPublished), liveVersion: { increment: 1 } },
  })

  return { position: { x: null, y: null } }
})
