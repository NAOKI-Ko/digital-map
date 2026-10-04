import { runPlacementMutation } from '~~/server/utils/illustration-placement'
import { z } from 'zod'
import { refreshPrimaryProjection, recordPlacementAudit, reconcileUsagePublication } from '~~/server/utils/illustration-placement'
export default defineEventHandler(async event => {
  const context = await requireOwnedSpot(event)
  const { expectedVersion } = await readValidatedBody(event, z.object({ expectedVersion: z.number().int().positive() }).parse)
  return runPlacementMutation(async tx => {
    const placement = await tx.illustrationPlacement.findFirst({ where: { id: getRouterParam(event, 'placementId'), usage: { spotId: context.spot.id, mapId: context.map.id } } })
    if (!placement) throw createError({ statusCode: 404, statusMessage: '配置が見つかりません。' })
    const result = await tx.illustrationPlacement.deleteMany({ where: { id: placement.id, version: expectedVersion } })
    if (result.count !== 1) throw createError({ statusCode: 409, statusMessage: '配置が更新されています。再読込してください。' })
    if (placement.isPrimary) await refreshPrimaryProjection(tx, placement.usageId)
    await reconcileUsagePublication(tx, placement.usageId)
    await recordPlacementAudit(tx, context, 'PLACEMENT_DELETED', placement.id, context.spot.id)
    return { deletedId: placement.id }
  })
})
