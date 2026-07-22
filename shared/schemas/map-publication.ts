import { z } from 'zod'

export const mapPublicationSchema = z.object({
  isPublished: z.boolean(),
})

export type MapPublicationInput = z.infer<typeof mapPublicationSchema>
