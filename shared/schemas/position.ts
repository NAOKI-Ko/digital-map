import { z } from 'zod'

export const spotPositionSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
})

export type SpotPositionInput = z.infer<typeof spotPositionSchema>
