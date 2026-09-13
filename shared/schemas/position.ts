import { z } from 'zod'

export const spotPositionSchema = z.object({
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1),
})

export type SpotPositionInput = z.infer<typeof spotPositionSchema>
