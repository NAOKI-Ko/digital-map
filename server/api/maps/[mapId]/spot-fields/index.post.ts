import { customSpotFieldCreateSchema } from '~~/shared/schemas/spot-field'
import type { SpotFieldDefinitionResponse } from '~~/shared/types/spot-field'

export default defineEventHandler(async (event): Promise<SpotFieldDefinitionResponse> => {
  const { map } = await requireOwnedMap(event)
  const result = customSpotFieldCreateSchema.safeParse(await readBody(event))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? '項目を確認してください。' })
  const field = await prisma.spotFieldDefinition.create({
    data: { mapId: map.id, kind: 'custom', semanticKey: null, ...result.data },
    include: { _count: { select: { values: true } } },
  })
  setResponseStatus(event, 201)
  return { field: toSpotFieldDefinition(field) }
})
