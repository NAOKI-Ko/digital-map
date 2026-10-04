import { runPlacementMutation } from '~~/server/utils/illustration-placement'
import { placementUpdate, refreshPrimaryProjection, recordPlacementAudit, reconcileUsagePublication } from '~~/server/utils/illustration-placement'
export default defineEventHandler(async event => {
  const context = await requireOwnedSpot(event)
  const { expectedVersion, expectedFloorUpdatedAt, ...position } = await readValidatedBody(event, placementUpdate.parse)
  return runPlacementMutation(async tx => {
    const placement = await tx.illustrationPlacement.findFirst({ where: { id: getRouterParam(event, 'placementId'), usage: { spotId: context.spot.id, mapId: context.map.id } } })
    if (!placement) throw createError({ statusCode: 404, statusMessage: '配置が見つかりません。' })
    const result = await tx.illustrationPlacement.updateMany({ where: { id: placement.id, version: expectedVersion, floor: { updatedAt: new Date(expectedFloorUpdatedAt) } }, data: { ...position, version: { increment: 1 } } })
    if (result.count !== 1) throw createError({ statusCode: 409, statusMessage: '配置が更新されています。再読込してください。' })
    if (placement.isPrimary) await refreshPrimaryProjection(tx, placement.usageId)
    await reconcileUsagePublication(tx, placement.usageId)
    await recordPlacementAudit(tx, context, 'PLACEMENT_MOVED', placement.id, context.spot.id)
    return { placement: { ...placement, ...position, version: expectedVersion + 1 } }
  })
})
