import { z } from 'zod'
import { customSpotFieldTypes, standardSpotFieldKeys } from '../constants/spot-fields'

const settings = {
  label: z.string().trim().min(1, '項目名を入力してください。').max(50),
  enabled: z.boolean(),
  publicVisible: z.boolean(),
  required: z.boolean(),
  order: z.number().int().min(0),
}

export const customSpotFieldCreateSchema = z.object({
  ...settings,
  type: z.enum(customSpotFieldTypes),
})

export const spotFieldUpdateSchema = z.object({
  label: settings.label.optional(),
  enabled: settings.enabled.optional(),
  publicVisible: settings.publicVisible.optional(),
  required: settings.required.optional(),
  order: settings.order.optional(),
  type: z.enum(customSpotFieldTypes).optional(),
}).refine(value => Object.keys(value).length > 0, '変更内容を指定してください。')
  .refine(value => value.enabled !== false || value.publicVisible !== true, {
    path: ['publicVisible'],
    message: '無効な項目を公開にはできません。',
  })

export const spotFieldReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
}).refine(value => new Set(value.orderedIds).size === value.orderedIds.length, {
  path: ['orderedIds'],
  message: '項目IDが重複しています。',
})

export const customSpotValuesSchema = z.record(z.string(), z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
])).default({})

export function validateCustomFieldValue(type: string, value: unknown) {
  if (value === null || value === '') return true
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value)
  if (type === 'boolean') return typeof value === 'boolean'
  if (type === 'url') return typeof value === 'string' && /^https?:\/\/[^\s]+$/i.test(value)
  return typeof value === 'string'
}

export function isStandardSpotFieldKey(value: string): value is typeof standardSpotFieldKeys[number] {
  return standardSpotFieldKeys.includes(value as typeof standardSpotFieldKeys[number])
}
