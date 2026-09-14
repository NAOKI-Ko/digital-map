import { spotPositionSchema } from '~~/shared/schemas/position'
import type { SpotPositionResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<SpotPositionResponse> => {
  const { spot } = await requireOwnedSpot(event)
  const result = spotPositionSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'イラスト上の位置を確認してください。' })
  }

  await prisma.spot.update({
    where: { id: spot.id },
    data: { ...result.data, liveVersion: { increment: 1 } },
  })

  return { position: result.data }
})
