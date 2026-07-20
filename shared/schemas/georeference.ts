import { z } from 'zod'

const latitude = z.number().finite().min(-90).max(90)
const longitude = z.number().finite().min(-180).max(180)

export const geoReferenceSchema = z.object({
  topLeftLat: latitude,
  topLeftLng: longitude,
  topRightLat: latitude,
  topRightLng: longitude,
  bottomRightLat: latitude,
  bottomRightLng: longitude,
  bottomLeftLat: latitude,
  bottomLeftLng: longitude,
}).superRefine((value, context) => {
  const corners = [
    `${value.topLeftLat},${value.topLeftLng}`,
    `${value.topRightLat},${value.topRightLng}`,
    `${value.bottomRightLat},${value.bottomRightLng}`,
    `${value.bottomLeftLat},${value.bottomLeftLng}`,
  ]

  if (new Set(corners).size !== 4) {
    context.addIssue({
      code: 'custom',
      message: '四隅はそれぞれ異なる位置に設定してください。',
    })
  }
})

export type GeoReferenceInput = z.infer<typeof geoReferenceSchema>
