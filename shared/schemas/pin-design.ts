import { z } from 'zod'
import { pinIconPresets } from '~~/shared/constants/spot'
import { uploadedImageUrlSchema } from '~~/shared/schemas/photo'

const presetIds = pinIconPresets.map(preset => preset.id) as [string, ...string[]]

export const pinDesignSchema = z.object({
  pinIconType: z.enum(['preset', 'custom']),
  pinIconId: z.enum(presetIds).nullable(),
  pinIconImageUrl: uploadedImageUrlSchema.nullable(),
  pinColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'ピン色を選択してください。'),
}).superRefine((value, context) => {
  if (value.pinIconType === 'preset' && !value.pinIconId) {
    context.addIssue({ code: 'custom', path: ['pinIconId'], message: 'プリセットアイコンを選択してください。' })
  }
  if (value.pinIconType === 'custom' && !value.pinIconImageUrl) {
    context.addIssue({ code: 'custom', path: ['pinIconImageUrl'], message: 'カスタム画像をアップロードしてください。' })
  }
})

export type PinDesignInput = z.infer<typeof pinDesignSchema>
