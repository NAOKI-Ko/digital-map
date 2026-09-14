import { z } from 'zod'

export const mapSeoSchema = z.object({
  title: z.string().trim().max(100).nullable().optional(),
  description: z.string().trim().max(300).nullable().optional(),
  imageAssetId: z.string().trim().nullable().optional(),
}).strict()
