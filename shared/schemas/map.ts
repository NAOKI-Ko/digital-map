import { z } from 'zod'

export const mapNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'マップ名を入力してください。')
    .max(100, 'マップ名は100文字以内で入力してください。'),
})

export type MapNameInput = z.infer<typeof mapNameSchema>

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
    z.string().trim().startsWith('/uploads/', 'アップロードしたロゴ画像を指定してください。').nullable(),
  ),
  websiteUrl: nullableHttpUrl,
  snsUrl: nullableHttpUrl,
})

export type MapBrandingInput = z.infer<typeof mapBrandingSchema>
