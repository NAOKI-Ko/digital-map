import { z } from 'zod'

export const uploadedImageUrlSchema = z.string().regex(/^\/uploads\/[0-9a-f-]+\.(?:png|jpg)$/)

export const spotPhotosSchema = z.object({
  photos: z.array(uploadedImageUrlSchema).max(6, '写真は6枚まで登録できます。').refine(
    photos => new Set(photos).size === photos.length,
    '同じ写真を重複して登録できません。',
  ),
})

export type SpotPhotosInput = z.infer<typeof spotPhotosSchema>
