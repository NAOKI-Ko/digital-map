import { z } from 'zod'

const latitude = z.number().finite().min(-90).max(90)
const longitude = z.number().finite().min(-180).max(180)
const imageCoordinate = z.number().finite().min(0).max(1)

export const geoReferenceSchema = z.object({
  refAImageX: imageCoordinate,
  refAImageY: imageCoordinate,
  refALat: latitude,
  refALng: longitude,
  refBImageX: imageCoordinate,
  refBImageY: imageCoordinate,
  refBLat: latitude,
  refBLng: longitude,
})

export type GeoReferenceInput = z.infer<typeof geoReferenceSchema>
