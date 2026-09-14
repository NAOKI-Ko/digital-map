import { z } from 'zod'
import { uploadedImageUrlSchema } from '~~/shared/schemas/photo'

export const floorCreateSchema = z.object({
  name: z.string().trim().min(1, 'フロア名を入力してください。').max(50, 'フロア名は50文字以内で入力してください。'),
  illustrationUrl: uploadedImageUrlSchema,
  imageWidth: z.number().int().positive('画像の幅を読み取れませんでした。'),
  imageHeight: z.number().int().positive('画像の高さを読み取れませんでした。'),
  illustrationAssetId: z.string().min(1).optional(),
})

export const floorUpdateSchema = z.object({
  name: z.string().trim().min(1, 'フロア名を入力してください。').max(50, 'フロア名は50文字以内で入力してください。'),
  illustrationUrl: uploadedImageUrlSchema.optional(),
  imageWidth: z.number().int().positive().optional(),
  imageHeight: z.number().int().positive().optional(),
  illustrationAssetId: z.string().min(1).nullable().optional(),
}).superRefine((value, context) => {
  const imageValues = [value.illustrationUrl, value.imageWidth, value.imageHeight]
  if (imageValues.some(item => item !== undefined) && imageValues.some(item => item === undefined)) {
    context.addIssue({ code: 'custom', message: '画像URLと画像サイズをすべて指定してください。' })
  }
})

export const floorReorderSchema = z.object({
  floorIds: z.array(z.string().min(1)).min(1),
})

export type FloorCreateInput = z.infer<typeof floorCreateSchema>
export type FloorUpdateInput = z.infer<typeof floorUpdateSchema>
