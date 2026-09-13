export function toFloorDecoration(item: { id: string, floorId: string, assetId: string, x: number, y: number, width: number, rotation: number, order: number, asset: { storageKey: string, width: number, height: number } }) {
  return { id: item.id, floorId: item.floorId, assetId: item.assetId, imageUrl: `/uploads/${item.asset.storageKey}`, imageWidth: item.asset.width, imageHeight: item.asset.height, x: item.x, y: item.y, width: item.width, rotation: item.rotation, order: item.order }
}
export const decorationInclude = { asset: { select: { storageKey: true, width: true, height: true } } } as const
