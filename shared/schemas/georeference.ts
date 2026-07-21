import { z } from 'zod'
import { getGeoReferenceValidationError } from '../../lib/geo'

const latitude = z.number().finite().min(-90).max(90)
const longitude = z.number().finite().min(-180).max(180)

export const geoReferenceSchema = z.object({
  topLeftLat: latitude,
  topLeftLng: longitude,
  bottomRightLat: latitude,
  bottomRightLng: longitude,
}).superRefine((value, context) => {
  const message = getGeoReferenceValidationError({
    topLeft: { lat: value.topLeftLat, lng: value.topLeftLng },
    bottomRight: { lat: value.bottomRightLat, lng: value.bottomRightLng },
  })

  if (message) {
    context.addIssue({ code: 'custom', message })
  }
})

export type GeoReferenceInput = z.infer<typeof geoReferenceSchema>
