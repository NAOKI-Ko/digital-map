import { spotFieldReorderSchema } from '~~/shared/schemas/spot-field'

export default defineEventHandler(async (event) => {
  const { map } = await requireOwnedMap(event)
  const result = spotFieldReorderSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '表示順を確認してください。' })

  const existing = await prisma.spotFieldDefinition.findMany({
    where: { mapId: map.id },
    select: { id: true },
  })
  const existingIds = new Set(existing.map(field => field.id))
  if (existing.length !== result.data.orderedIds.length || result.data.orderedIds.some(id => !existingIds.has(id))) {
    throw createError({ statusCode: 409, statusMessage: '項目一覧が更新されています。再読み込みしてから並べ替えてください。' })
  }

  await prisma.$transaction(result.data.orderedIds.map((id, order) => prisma.spotFieldDefinition.update({
    where: { id },
    data: { order },
  })))

  return { orderedIds: result.data.orderedIds }
})
