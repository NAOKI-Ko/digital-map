import { decorationUpdateSchema } from '~~/shared/schemas/decoration'
import type { FloorDecorationResponse } from '~~/shared/types/decoration'
export default defineEventHandler(async (event): Promise<FloorDecorationResponse> => {
  const { floor } = await requireOwnedFloor(event)
  const id = getRouterParam(event, 'decorationId')
  const existing = await prisma.floorDecoration.findFirst({ where: { id, floorId: floor.id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Decorationが見つかりません。' })
  const input = await readValidatedBody(event, decorationUpdateSchema.parse)
  const item = await prisma.floorDecoration.update({ where: { id: existing.id }, data: input, include: decorationInclude })
  return { decoration: toFloorDecoration(item) }
})
