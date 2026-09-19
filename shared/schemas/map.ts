import { z } from 'zod'
import { uploadedImageUrlSchema } from './photo'

export const mapNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'マップ名を入力してください。')
    .max(100, 'マップ名は100文字以内で入力してください。'),
})

export type MapNameInput = z.infer<typeof mapNameSchema>

export const mapCreateSchema = z.object({
  mapType: z.literal('illustration', { error: 'Phase 1ではイラストマップだけ作成できます。' }),
  name: mapNameSchema.shape.name,
  slug: z.string().trim().min(3, '公開パスは3文字以上で入力してください。').max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '公開パスは半角英小文字・数字・ハイフンで入力してください。'),
})

export type MapCreateInput = z.infer<typeof mapCreateSchema>

const nullableText = (maximum: number, message: string) => z.preprocess(
  value => typeof value === 'string' && value.trim() === '' ? null : value,
  z.string().trim().max(maximum, message).nullable(),
)

const nullableHttpUrl = z.preprocess(
  value => typeof value === 'string' && value.trim() === '' ? null : value,
  z.string().trim().url('URLの形式を確認してください。').refine(
    value => /^https?:\/\//i.test(value),
    'httpまたはhttpsのURLを入力してください。',
  ).nullable(),
)

export const mapBrandingSchema = z.object({
  organizationName: nullableText(100, '団体名は100文字以内で入力してください。'),
  logoUrl: z.preprocess(
    value => typeof value === 'string' && value.trim() === '' ? null : value,
    uploadedImageUrlSchema.nullable(),
  ),
  logoAssetId: z.string().min(1).nullable().optional(),
  websiteUrl: nullableHttpUrl,
  snsUrl: nullableHttpUrl,
})

export type MapBrandingInput = z.infer<typeof mapBrandingSchema>
