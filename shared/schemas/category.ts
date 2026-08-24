import { z } from 'zod'

export const categoryNameSchema = z.string().trim().min(1, 'カテゴリー名を入力してください。').max(50, 'カテゴリー名は50文字以内で入力してください。')
export const categoryOrderSchema = z.number().int('並び順は整数で指定してください。').min(0, '並び順は0以上で指定してください。')

export const categoryCreateSchema = z.object({
  name: categoryNameSchema,
  order: categoryOrderSchema.optional(),
})

export const categoryUpdateSchema = z.object({
  name: categoryNameSchema.optional(),
  order: categoryOrderSchema.optional(),
}).refine(value => value.name !== undefined || value.order !== undefined, '変更内容を指定してください。')

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
