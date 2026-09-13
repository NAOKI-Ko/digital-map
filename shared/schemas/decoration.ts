import { z } from 'zod'

export const decorationCreateSchema = z.object({
  assetId: z.string().min(1), x: z.number().finite().min(0).max(1).default(0.5), y: z.number().finite().min(0).max(1).default(0.5), width: z.number().finite().positive().max(1).default(0.2), rotation: z.number().finite().min(-360).max(360).default(0),
})
export const decorationUpdateSchema = z.object({
  x: z.number().finite().min(0).max(1).optional(), y: z.number().finite().min(0).max(1).optional(), width: z.number().finite().positive().max(1).optional(), rotation: z.number().finite().min(-360).max(360).optional(), order: z.number().int().min(0).optional(),
}).refine(value => Object.keys(value).length > 0)
