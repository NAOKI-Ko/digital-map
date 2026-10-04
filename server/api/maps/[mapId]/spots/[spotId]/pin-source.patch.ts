import { updateSpotWithUsage } from '~~/server/utils/spot-usage'
import { pinSourceSchema } from '~~/shared/schemas/pin-source'
import { resolveEffectivePinAppearance } from '~~/shared/utils/pin-appearance'
import { pinConflict } from '~~/server/utils/pin-appearance'

export default defineEventHandler(async (event) => {
  const { map, spot: ownedSpot } = await requireOwnedSpot(event)
  const parsed = pinSourceSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: parsed.error.issues[0]?.message })
  const command = parsed.data
  try {
    const spot = await prisma.$transaction(async tx => {
      const current = await tx.spot.findFirst({ where: { id: ownedSpot.id, tenantId: map.tenantId, mapUsage: { mapId: map.id } }, include: adminSpotInclude })
      if (!current || current.liveVersion !== command.expectedVersion) throw pinConflict()
      if (command.categoryId && !current.spotCategories.some(item => item.category.id === command.categoryId)) {
        throw createError({ statusCode: 422, statusMessage: '所属カテゴリーからPIN用カテゴリーを選択してください。' })
      }
      if (command.mode === 'category') {
        const source = await tx.category.findFirst({ where: { id: command.categoryId!, mapId: map.id, tenantId: map.tenantId } })
        if (!source || source.pinDefaultRevision !== command.expectedCategoryRevision) throw pinConflict()
      }
      return updateSpotWithUsage(tx, {
        where: { id: current.id, liveVersion: command.expectedVersion },
        data: {
          ...(command.mode === 'individual' ? resolveEffectivePinAppearance(current) : {}),
          pinSourceMode: command.mode, pinSourceCategoryId: command.categoryId,
          liveVersion: { increment: 1 },
        },
        include: adminSpotInclude,
      })
    }, { isolationLevel: 'Serializable' })
    return { spot: toAdminSpotDetail(spot) }
  }
  catch (error) {
    if (typeof error === 'object' && error && 'code' in error && ['P2034', 'P2025'].includes(String(error.code))) throw pinConflict()
    throw error
  }
})
