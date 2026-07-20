import { spotPositionSchema } from '~~/shared/schemas/position'
import type { SpotPositionResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<SpotPositionResponse> => {
  const { spot } = await requireOwnedSpot(event)
  const result = spotPositionSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: '緯度・経度を確認してください。' })
  }

  await prisma.spot.update({
    where: { id: spot.id },
    data: result.data,
  })

  return { position: result.data }
})
