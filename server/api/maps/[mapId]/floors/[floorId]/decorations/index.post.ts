import { decorationCreateSchema } from '~~/shared/schemas/decoration'
import type { FloorDecorationResponse } from '~~/shared/types/decoration'
export default defineEventHandler(async (event): Promise<FloorDecorationResponse> => {
  const { floor, session } = await requireOwnedFloor(event)
  const input = await readValidatedBody(event, decorationCreateSchema.parse)
  const asset = await resolveTenantMediaAsset(session.user.tenantId, input.assetId, 'decoration')
  if (!asset) throw createError({ statusCode: 422, statusMessage: 'Media Libraryの画像を選択してください。' })
  const order = ((await prisma.floorDecoration.aggregate({ where: { floorId: floor.id }, _max: { order: true } }))._max.order ?? -1) + 1
  const item = await prisma.floorDecoration.create({ data: { floorId: floor.id, assetId: asset.id, x: input.x, y: input.y, width: input.width, rotation: input.rotation, order }, include: decorationInclude })
  setResponseStatus(event, 201)
  return { decoration: toFloorDecoration(item) }
})
