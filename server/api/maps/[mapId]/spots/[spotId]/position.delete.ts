import type { SpotPositionResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<SpotPositionResponse> => {
  const { spot } = await requireOwnedSpot(event)
  await prisma.spot.update({
    where: { id: spot.id },
    data: { x: null, y: null, isPublished: false },
  })

  return { position: { x: null, y: null } }
})
