import { z } from 'zod'

export const uploadedImageUrlSchema = z.string().regex(/^\/uploads\/[0-9a-f-]+\.(?:png|jpg)$/)

export const spotPhotosSchema = z.object({
  photos: z.array(uploadedImageUrlSchema).max(6, '写真は6枚まで登録できます。').refine(
    photos => new Set(photos).size === photos.length,
    '同じ写真を重複して登録できません。',
  ),
  assetIds: z.array(z.string().min(1).nullable()).max(6).optional(),
}).superRefine((value, context) => {
  if (value.assetIds && value.assetIds.length !== value.photos.length) {
    context.addIssue({ code: 'custom', path: ['assetIds'], message: '写真と登録画像IDの対応を確認してください。' })
  }
})

export type SpotPhotosInput = z.infer<typeof spotPhotosSchema>
