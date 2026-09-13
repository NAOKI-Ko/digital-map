import { spotFieldUpdateSchema } from '~~/shared/schemas/spot-field'
import type { SpotFieldDefinitionResponse } from '~~/shared/types/spot-field'

export default defineEventHandler(async (event): Promise<SpotFieldDefinitionResponse> => {
  const { map } = await requireOwnedMap(event)
  const owned = await requireOwnedSpotField(map.id, getRouterParam(event, 'fieldId'))
  const result = spotFieldUpdateSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '項目を確認してください。' })
  if (owned.kind === 'standard' && result.data.type && result.data.type !== owned.type) {
    throw createError({ statusCode: 422, statusMessage: '標準項目の種類は変更できません。' })
  }
  if (owned.kind === 'custom' && owned._count.values > 0 && result.data.type && result.data.type !== owned.type) {
    throw createError({ statusCode: 409, statusMessage: '値が登録済みのカスタム項目は種類を変更できません。' })
  }
  const data = {
    ...result.data,
    ...(result.data.enabled === false ? { publicVisible: false } : {}),
  }
  const field = await prisma.spotFieldDefinition.update({
    where: { id: owned.id },
    data,
    include: { _count: { select: { values: true } } },
  })
  return { field: toSpotFieldDefinition(field) }
})
