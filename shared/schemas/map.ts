import { z } from 'zod'

export const mapNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'マップ名を入力してください。')
    .max(100, 'マップ名は100文字以内で入力してください。'),
})

export type MapNameInput = z.infer<typeof mapNameSchema>
