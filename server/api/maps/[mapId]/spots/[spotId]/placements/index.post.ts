import { runPlacementMutation } from '~~/server/utils/illustration-placement'
import { placementInput, refreshPrimaryProjection, recordPlacementAudit } from '~~/server/utils/illustration-placement'
export default defineEventHandler(async event => {
  const context = await requireOwnedSpot(event)
  const input = await readValidatedBody(event, placementInput.parse)
  return runPlacementMutation(async tx => {
    const usage = await tx.mapSpotUsage.findUnique({ where: { spotId: context.spot.id }, include: { placements: { select: { id: true } } } })
    const floor = await tx.mapFloor.findFirst({ where: { id: input.floorId, mapId: context.map.id } })
    if (!floor || usage?.mapId !== context.map.id) throw createError({ statusCode: 404, statusMessage: '配置先が見つかりません。' })
    const placement = await tx.illustrationPlacement.create({ data: { ...input, usageId: usage.id, isPrimary: !usage.placements.length } })
    if (placement.isPrimary) await refreshPrimaryProjection(tx, usage.id)
    await recordPlacementAudit(tx, context, 'PLACEMENT_CREATED', placement.id, context.spot.id)
    setResponseStatus(event, 201)
    return { placement }
  })
})
