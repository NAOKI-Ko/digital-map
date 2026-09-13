export interface FloorDecorationItem { id: string, floorId: string, assetId: string, imageUrl: string, imageWidth: number, imageHeight: number, x: number, y: number, width: number, rotation: number, order: number }
export interface FloorDecorationListResponse { decorations: FloorDecorationItem[] }
export interface FloorDecorationResponse { decoration: FloorDecorationItem }
