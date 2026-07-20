import { z } from 'zod'

const optionalText = (maximum: number, message: string) => z.string().trim().max(maximum, message)
const optionalCoordinate = (minimum: number, maximum: number, message: string) => z.preprocess(
  value => value === '' || value === undefined ? null : value,
  z.number({ error: message }).finite().min(minimum, message).max(maximum, message).nullable(),
)

export const spotFormSchema = z.object({
  floorId: z.string().min(1, 'フロアを選択してください。'),
  name: z.string().trim().min(1, '店名・スポット名を入力してください。').max(100, '名称は100文字以内で入力してください。'),
  category: z.string().trim().min(1, 'カテゴリを入力してください。').max(50, 'カテゴリは50文字以内で入力してください。'),
  description: optionalText(2000, '説明文は2000文字以内で入力してください。'),
  hoursText: optionalText(500, '営業時間は500文字以内で入力してください。'),
  holidayText: optionalText(500, '定休日は500文字以内で入力してください。'),
  phone: optionalText(50, '電話番号は50文字以内で入力してください。').refine(
    value => !value || /^[0-9+()\-ー―‐\s]+$/.test(value),
    '電話番号の形式を確認してください。',
  ),
  lat: optionalCoordinate(-90, 90, '緯度は-90〜90で入力してください。'),
  lng: optionalCoordinate(-180, 180, '経度は-180〜180で入力してください。'),
}).superRefine((value, context) => {
  if ((value.lat === null) !== (value.lng === null)) {
    const message = '緯度と経度は両方入力するか、両方空欄にしてください。'
    context.addIssue({ code: 'custom', path: ['lat'], message })
    context.addIssue({ code: 'custom', path: ['lng'], message })
  }
})

export const spotPublishSchema = z.object({
  isPublished: z.boolean(),
})

export type SpotFormInput = z.infer<typeof spotFormSchema>
export type SpotPublishInput = z.infer<typeof spotPublishSchema>
