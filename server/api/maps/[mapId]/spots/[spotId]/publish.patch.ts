import { spotPublishSchema } from '~~/shared/schemas/spot'
import type { SpotPublishResponse } from '~~/shared/types/spot'

export default defineEventHandler(async (event): Promise<SpotPublishResponse> => {
  const { spot, map, session } = await requireOwnedSpot(event)
  const result = spotPublishSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: result.error.issues[0]?.message ?? '公開状態を確認してください。',
    })
  }

  if (result.data.isPublished && (spot.x === null || spot.y === null)) {
    throw createError({
      statusCode: 422,
      statusMessage: '位置が未設定のスポットは公開できません。緯度と経度を設定してください。',
    })
  }

  const updatedSpot = await prisma.$transaction(async (tx) => {
    const updated = await tx.spot.update({ where: { id: spot.id }, data: { isPublished: result.data.isPublished, liveVersion: { increment: 1 } }, select: { isPublished: true, updatedAt: true } })
    await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: result.data.isPublished ? 'SPOT_PUBLISHED' : 'SPOT_UNPUBLISHED', targetType: 'Spot', targetId: spot.id, mapId: map.id, metadata: { isPublished: result.data.isPublished } })
    return updated
  })

  return {
    publication: {
      isPublished: updatedSpot.isPublished,
      updatedAt: updatedSpot.updatedAt.toISOString(),
    },
  }
})
