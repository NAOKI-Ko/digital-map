import type { FloorDecorationListResponse } from '~~/shared/types/decoration'
export default defineEventHandler(async (event): Promise<FloorDecorationListResponse> => {
  const { floor } = await requireOwnedFloor(event)
  const items = await prisma.floorDecoration.findMany({ where: { floorId: floor.id }, include: decorationInclude, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })
  return { decorations: items.map(toFloorDecoration) }
})
