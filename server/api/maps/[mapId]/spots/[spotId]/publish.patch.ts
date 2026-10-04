import { updateSpotWithUsage } from '~~/server/utils/spot-usage'
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

  const updatedSpot = await prisma.$transaction(async (tx) => {
    if (result.data.isPublished && !await tx.illustrationPlacement.count({ where: { usage: { spotId: spot.id, mapId: map.id }, x: { not: null }, y: { not: null } } })) throw createError({ statusCode: 422, statusMessage: '位置が未設定のスポットは公開できません。配置を設定してください。' })
    const updated = await updateSpotWithUsage(tx, { where: { id: spot.id }, data: { isPublished: result.data.isPublished, liveVersion: { increment: 1 } }, select: { isPublished: true, updatedAt: true } })
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
