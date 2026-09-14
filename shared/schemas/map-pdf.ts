import { z } from 'zod'

export const mapPdfRequestSchema = z.object({
  paper: z.enum(['A4', 'A3']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('landscape'),
  floorMode: z.enum(['selected', 'all']).default('selected'),
  floorId: z.string().min(1).optional(),
}).superRefine((value, context) => {
  if (value.floorMode === 'selected' && !value.floorId) context.addIssue({ code: 'custom', path: ['floorId'], message: 'フロアを選択してください。' })
})

export type MapPdfRequest = z.infer<typeof mapPdfRequestSchema>
