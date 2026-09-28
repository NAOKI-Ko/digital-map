import { z } from 'zod'
import { pinDesignSchema } from './pin-design'
export const pinSourceSchema = z.object({
  expectedCategoryRevision: z.number().int().nonnegative().optional(),
  expectedVersion: z.number().int().nonnegative(),
  mode: z.enum(['standard', 'category', 'individual']),
  categoryId: z.string().min(1).nullable(),
}).superRefine((value, ctx) => {
  if (value.mode === 'category' && value.expectedCategoryRevision === undefined) ctx.addIssue({ code: 'custom', path: ['expectedCategoryRevision'], message: 'カテゴリーの既定を再確認してください。' })
  if (value.mode === 'category' && !value.categoryId) ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'PIN用カテゴリーを選択してください。' })
  if (value.mode === 'standard' && value.categoryId) ctx.addIssue({ code: 'custom', path: ['categoryId'], message: '標準ピンではPIN用カテゴリーを解除してください。' })
})
export const categoryPinDefaultSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  dependentsVersion: z.string().length(64),
  design: pinDesignSchema.nullable(),
})
