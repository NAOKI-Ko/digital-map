import { z } from 'zod'
import { spotImportances } from '../constants/spot'
import { customSpotValuesSchema } from './spot-field'

const optionalText = (maximum: number, message: string) => z.string().trim().max(maximum, message)
const optionalCoordinate = (minimum: number, maximum: number, message: string) => z.preprocess(
  value => value === '' || value === undefined ? null : value,
  z.number({ error: message }).finite().min(minimum, message).max(maximum, message).nullable(),
)

const optionalRealCoordinate = (minimum: number, maximum: number, message: string) =>
  z.number({ error: message }).finite(message).min(minimum, message).max(maximum, message).nullable().optional()

export const spotFormSchema = z.object({
  floorId: z.string().min(1, 'フロアを選択してください。'),
  name: z.string().trim().min(1, '店名・スポット名を入力してください。').max(100, '名称は100文字以内で入力してください。'),
  categoryIds: z.array(z.string().min(1, 'カテゴリーIDが不正です。')).optional(),
  importance: z.enum(spotImportances).default('normal'),
  description: optionalText(2000, '説明文は2000文字以内で入力してください。'),
  address: optionalText(500, '住所は500文字以内で入力してください。').default(''),
  website: z.union([
    z.literal(''),
    z.string().trim().url('WebサイトURLの形式を確認してください。').refine(
      value => /^https?:\/\//i.test(value),
      'WebサイトURLはhttpまたはhttpsで入力してください。',
    ),
  ]).default(''),
  hoursText: optionalText(500, '営業時間は500文字以内で入力してください。'),
  holidayText: optionalText(500, '定休日は500文字以内で入力してください。'),
  phone: optionalText(50, '電話番号は50文字以内で入力してください。').refine(
    value => !value || /^[0-9+()\-ー―‐\s]+$/.test(value),
    '電話番号の形式を確認してください。',
  ),
  customValues: customSpotValuesSchema,
  x: optionalCoordinate(0, 1, 'X座標は0〜1で入力してください。'),
  y: optionalCoordinate(0, 1, 'Y座標は0〜1で入力してください。'),
  lat: optionalRealCoordinate(-90, 90, '緯度は-90〜90で入力してください。'),
  lng: optionalRealCoordinate(-180, 180, '経度は-180〜180で入力してください。'),
}).superRefine((value, context) => {
  if ((value.x === null) !== (value.y === null)) {
    const message = 'X座標とY座標は両方入力するか、両方空欄にしてください。'
    context.addIssue({ code: 'custom', path: ['x'], message })
    context.addIssue({ code: 'custom', path: ['y'], message })
  }
  if (value.lat !== undefined || value.lng !== undefined) {
    if ((value.lat === null || value.lat === undefined) !== (value.lng === null || value.lng === undefined)) {
      const message = '緯度と経度は両方入力するか、両方空欄にしてください。'
      context.addIssue({ code: 'custom', path: ['lat'], message })
      context.addIssue({ code: 'custom', path: ['lng'], message })
    }
  }
})

export const spotPublishSchema = z.object({
  isPublished: z.boolean(),
})

export type SpotFormInput = z.infer<typeof spotFormSchema>
export type SpotPublishInput = z.infer<typeof spotPublishSchema>
