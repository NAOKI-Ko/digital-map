import { spotPublishSchema } from '~~/shared/schemas/spot'
import type { SpotPublishResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<SpotPublishResponse> => {
  const { spot } = await requireOwnedSpot(event)
  const result = spotPublishSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '公開状態を確認してください。',
    })
  }

  if (result.data.isPublished && (spot.lat === null || spot.lng === null)) {
    throw createError({
      statusCode: 422,
      statusMessage: '位置が未設定のスポットは公開できません。緯度と経度を設定してください。',
    })
  }

  const updatedSpot = await prisma.spot.update({
    where: { id: spot.id },
    data: { isPublished: result.data.isPublished },
    select: { isPublished: true, updatedAt: true },
  })

  return {
    publication: {
      isPublished: updatedSpot.isPublished,
      updatedAt: updatedSpot.updatedAt.toISOString(),
    },
  }
})
