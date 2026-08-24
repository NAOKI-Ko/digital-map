import { z } from 'zod'

export const spotBulkSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('delete'), spotIds: z.array(z.string().min(1)).min(1).max(100) }),
  z.object({ action: z.enum(['publish', 'unpublish']), spotIds: z.array(z.string().min(1)).min(1).max(100) }),
  z.object({ action: z.literal('setCategories'), spotIds: z.array(z.string().min(1)).min(1).max(100), categoryIds: z.array(z.string().min(1)) }),
])

export type SpotBulkInput = z.infer<typeof spotBulkSchema>
