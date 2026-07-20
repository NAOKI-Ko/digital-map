import { spotPhotosSchema } from '~~/shared/schemas/photo'
import type { SpotPhotosResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<SpotPhotosResponse> => {
  const { spot } = await requireOwnedSpot(event)
  const result = spotPhotosSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '写真の指定を確認してください。',
    })
  }

  await prisma.spot.update({
    where: { id: spot.id },
    data: { photosJson: result.data.photos },
  })

  return { photos: result.data.photos }
})
