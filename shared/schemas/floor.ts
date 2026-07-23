import { z } from 'zod'

const localUploadUrlSchema = z.string().regex(
  /^\/uploads\/[0-9a-f-]+\.(?:png|jpg)$/,
  'アップロード済みの画像を選択してください。',
)

export const floorCreateSchema = z.object({
  name: z.string().trim().min(1, 'フロア名を入力してください。').max(50, 'フロア名は50文字以内で入力してください。'),
  illustrationUrl: localUploadUrlSchema,
  imageWidth: z.number().int().positive('画像の幅を読み取れませんでした。'),
  imageHeight: z.number().int().positive('画像の高さを読み取れませんでした。'),
})

export const floorUpdateSchema = z.object({
  name: z.string().trim().min(1, 'フロア名を入力してください。').max(50, 'フロア名は50文字以内で入力してください。'),
})

export const floorReorderSchema = z.object({
  floorIds: z.array(z.string().min(1)).min(1),
})

export type FloorCreateInput = z.infer<typeof floorCreateSchema>
export type FloorUpdateInput = z.infer<typeof floorUpdateSchema>
