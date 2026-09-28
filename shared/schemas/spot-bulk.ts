import { z } from 'zod'
const common = { spotIds: z.array(z.string().min(1)).min(1).max(100), reviewToken: z.string().length(64).optional() }
export const spotBulkSchema = z.discriminatedUnion('action', [
  z.object({ ...common, action: z.literal('delete') }),
  z.object({ ...common, action: z.enum(['publish', 'unpublish']) }),
  z.object({ ...common, action: z.enum(['addCategory', 'removeCategory']), categoryId: z.string().min(1) }),
  z.object({ ...common, action: z.literal('assignFloor'), floorId: z.string().min(1) }),
  z.object({ ...common, action: z.literal('pinSource'), mode: z.enum(['standard', 'individual', 'category', 'soleCategory']), categoryId: z.string().min(1).optional() }),
])
export type SpotBulkInput = z.infer<typeof spotBulkSchema>
