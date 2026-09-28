import { spotBulkSchema } from '~~/shared/schemas/spot-bulk'
import { planSpotBulk, publicBulkPlan } from '~~/server/utils/spot-bulk'
export default defineEventHandler(async event => {
  const { map } = await requireOwnedMap(event)
  const parsed = spotBulkSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: '一括操作の内容を確認してください。' })
  return prisma.$transaction(async tx => publicBulkPlan(await planSpotBulk(tx, map, parsed.data)), { isolationLevel: 'RepeatableRead' })
})
