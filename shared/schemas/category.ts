import { z } from 'zod'
import { categoryIconTypes, isCategoryIconPresetId } from '~~/shared/constants/category'

export const categoryNameSchema = z.string().trim().min(1, 'カテゴリー名を入力してください。').max(50, 'カテゴリー名は50文字以内で入力してください。')
export const categoryOrderSchema = z.number().int('並び順は整数で指定してください。').min(0, '並び順は0以上で指定してください。')
export const categoryIconImageUrlSchema = z.string().regex(
  /^\/uploads\/category-icon-[A-Za-z0-9_-]+--[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:png|jpg)$/,
  'アップロードしたカテゴリー画像を選択してください。',
)

const categoryIconFields = {
  iconType: z.enum(categoryIconTypes).nullable().optional(),
  iconPresetId: z.string().max(100, 'プリセットアイコンを選択してください。').nullable().optional(),
  iconImageUrl: categoryIconImageUrlSchema.nullable().optional(),
}

function validateCategoryIcon(value: {
  iconType?: 'preset' | 'custom' | null
  iconPresetId?: string | null
  iconImageUrl?: string | null
}, context: z.RefinementCtx) {
  const hasPayload = value.iconPresetId != null || value.iconImageUrl != null
  if (value.iconType === undefined) {
    if (hasPayload) context.addIssue({ code: 'custom', path: ['iconType'], message: 'アイコンの種類を選択してください。' })
    return
  }
  if (value.iconType === null) {
    if (hasPayload) context.addIssue({ code: 'custom', path: ['iconType'], message: 'アイコンなしの場合は画像やプリセットを指定できません。' })
    return
  }
  if (value.iconType === 'preset') {
    if (!value.iconPresetId || !isCategoryIconPresetId(value.iconPresetId)) {
      context.addIssue({ code: 'custom', path: ['iconPresetId'], message: 'プリセットアイコンを選択してください。' })
    }
    if (value.iconImageUrl != null) context.addIssue({ code: 'custom', path: ['iconImageUrl'], message: 'プリセットと画像は同時に指定できません。' })
    return
  }
  if (!value.iconImageUrl) context.addIssue({ code: 'custom', path: ['iconImageUrl'], message: 'カスタム画像をアップロードしてください。' })
  if (value.iconPresetId != null) context.addIssue({ code: 'custom', path: ['iconPresetId'], message: '画像とプリセットは同時に指定できません。' })
}

export const categoryCreateSchema = z.object({
  name: categoryNameSchema,
  order: categoryOrderSchema.optional(),
  ...categoryIconFields,
}).superRefine(validateCategoryIcon)

export const categoryUpdateSchema = z.object({
  name: categoryNameSchema.optional(),
  order: categoryOrderSchema.optional(),
  ...categoryIconFields,
}).superRefine(validateCategoryIcon).refine(
  value => Object.values(value).some(item => item !== undefined),
  '変更内容を指定してください。',
)

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
