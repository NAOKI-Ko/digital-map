import { updateLegacySpot } from '~~/server/utils/spot-usage'
import { spotPositionSchema } from '~~/shared/schemas/position'
import { pinConflict } from '~~/server/utils/pin-appearance'
export default defineEventHandler(async event => {
  const { spot } = await requireOwnedSpot(event)
  const body = await readBody(event)
  const result = spotPositionSchema.safeParse(body)
  if (!result.success) throw createError({ statusCode: 422, statusMessage: 'イラスト上の位置を確認してください。' })
  const floorDate = typeof body.expectedFloorUpdatedAt === 'string' ? new Date(body.expectedFloorUpdatedAt) : null
  if (!floorDate || !Number.isFinite(floorDate.getTime())) throw pinConflict()
  if (body.expectedVersion !== spot.liveVersion || body.expectedFloorId !== spot.floorId) throw pinConflict()
  try {
    const updated = await updateLegacySpot({
      where: { id: spot.id, liveVersion: body.expectedVersion, floorId: body.expectedFloorId, floor: { updatedAt: floorDate } },
      data: { ...result.data, liveVersion: { increment: 1 } }, select: { liveVersion: true },
    })
    return { position: result.data, liveVersion: updated.liveVersion }
  }
  catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') throw pinConflict()
    throw error
  }
})
