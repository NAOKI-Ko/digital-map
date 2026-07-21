import { z } from 'zod'

const latitude = z.number().finite().min(-90).max(90)
const longitude = z.number().finite().min(-180).max(180)
const pixelCoordinate = z.number().finite().nonnegative()

export const geoReferenceSchema = z.object({
  refAPixelX: pixelCoordinate,
  refAPixelY: pixelCoordinate,
  refALat: latitude,
  refALng: longitude,
  refBPixelX: pixelCoordinate,
  refBPixelY: pixelCoordinate,
  refBLat: latitude,
  refBLng: longitude,
})

export type GeoReferenceInput = z.infer<typeof geoReferenceSchema>
