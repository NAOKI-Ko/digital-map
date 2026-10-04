import { updateSpotWithUsage, detachSpotUsage } from '~~/server/utils/spot-usage'
import { spotBulkSchema } from '~~/shared/schemas/spot-bulk'
import { planSpotBulk } from '~~/server/utils/spot-bulk'
import { pinConflict } from '~~/server/utils/pin-appearance'
export default defineEventHandler(async event => {
  const { map, session, isOwner } = await requireOwnedMap(event)
  const parsed = spotBulkSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: '一括操作の内容を確認してください。' })
  const input = parsed.data
  if (!input.reviewToken) throw createError({ statusCode: 409, statusMessage: '変更内容を確認してから実行してください。' })
  try {
    return await prisma.$transaction(async tx => {
      if (!isOwner && await tx.spot.count({ where: { id: { in: input.spotIds }, tenantId: map.tenantId, mapUsage: { mapId: map.id }, OR: [{ stewardMapId: null }, { stewardMapId: { not: map.id } }] } })) throw createError({ statusCode: 403, statusMessage: 'オーナーのみ編集できるスポットが含まれています。' })
      const plan = await planSpotBulk(tx, map, input)
      if (input.reviewToken !== plan.token) throw pinConflict()
      const blocked = plan.rows.filter(row => row.error)
      if (blocked.length) throw createError({ statusCode: 409, statusMessage: '実行できないスポットがあります。変更は保存されていません。', data: { rows: blocked.map(({ id, name, error }) => ({ id, name, error })) } })
      for (const row of plan.rows.filter(row => row.changed)) {
        if (input.action === 'delete') await detachSpotUsage(tx, row.id, map.id, row.version)
        else {
          if (input.action === 'addCategory') await tx.spotCategory.createMany({ data: [{ spotId: row.id, categoryId: input.categoryId }], skipDuplicates: true })
          if (input.action === 'removeCategory') await tx.spotCategory.deleteMany({ where: { spotId: row.id, categoryId: input.categoryId } })
          await updateSpotWithUsage(tx, { where: { id: row.id, liveVersion: row.version }, data: { ...row.data, ...(['addCategory', 'removeCategory'].includes(input.action) ? { contentVersion: { increment: 1 } } : {}), liveVersion: { increment: 1 } } })
        }
      }
      await appendAuditEvent(tx, { tenantId: map.tenantId, actorUserId: session.user.id, action: 'SPOT_BULK_APPLIED', targetType: 'Map', targetId: map.id, mapId: map.id, metadata: { action: input.action, spotIds: plan.rows.map(row => row.id), total: plan.total, changed: plan.changed, unchanged: plan.unchanged } })
      return { updatedCount: plan.changed, unchangedCount: plan.unchanged, total: plan.total }
    }, { isolationLevel: 'Serializable' })
  }
  catch (error) {
    if (typeof error === 'object' && error && 'code' in error && ['P2034', 'P2025'].includes(String(error.code))) throw pinConflict()
    throw error
  }
})
