import { z } from 'zod'
import { isSupportedPinIconId, pinIconTypes } from '~~/shared/constants/spot'
import { uploadedImageUrlSchema } from '~~/shared/schemas/photo'

export const pinDesignSchema = z.object({
  pinIconType: z.enum(pinIconTypes),
  pinIconId: z.string()
    .refine(isSupportedPinIconId, 'プリセットアイコンを選択してください。')
    .nullable(),
  pinIconImageUrl: uploadedImageUrlSchema.nullable(),
  pinColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'ピン色を選択してください。'),
}).superRefine((value, context) => {
  if (value.pinIconType === 'preset' && !value.pinIconId) {
    context.addIssue({ code: 'custom', path: ['pinIconId'], message: 'プリセットアイコンを選択してください。' })
  }
  if ((value.pinIconType === 'custom' || value.pinIconType === 'illustration') && !value.pinIconImageUrl) {
    context.addIssue({
      code: 'custom',
      path: ['pinIconImageUrl'],
      message: value.pinIconType === 'illustration'
        ? '直置きするイラスト画像をアップロードしてください。'
        : 'カスタム画像をアップロードしてください。',
    })
  }
})

export type PinDesignInput = z.infer<typeof pinDesignSchema>
