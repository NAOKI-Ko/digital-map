import type { SpotFieldDefinitionItem } from '~~/shared/types/spot-field'
import type { StandardSpotFieldKey, SpotFieldType } from '~~/shared/constants/spot-fields'
import type { Prisma } from '~~/prisma/generated/client'
import { validateCustomFieldValue } from '~~/shared/schemas/spot-field'
import { isMapLocale } from '~~/shared/constants/map-languages'

export function toSpotFieldDefinition(field: {
  id: string
  kind: string
  semanticKey: string | null
  label: string
  type: string
  enabled: boolean
  publicVisible: boolean
  required: boolean
  order: number
  _count: { values: number }
  translations?: Array<{ locale: string, label: string | null }>
}): SpotFieldDefinitionItem {
  return {
    ...field,
    kind: field.kind as 'standard' | 'custom',
    semanticKey: field.semanticKey as StandardSpotFieldKey | null,
    type: field.type as SpotFieldType,
    valueCount: field._count.values,
    translations: (field.translations ?? []).filter(translation => isMapLocale(translation.locale)).map(translation => ({
      locale: translation.locale as SpotFieldDefinitionItem['translations'][number]['locale'],
      label: translation.label,
    })),
  }
}

export async function requireOwnedSpotField(mapId: string, fieldId: string | undefined) {
  if (!fieldId) throw createError({ statusCode: 400, statusMessage: '項目IDが必要です。' })
  const field = await prisma.spotFieldDefinition.findFirst({
    where: { id: fieldId, mapId },
    include: { _count: { select: { values: true } } },
  })
  if (!field) throw createError({ statusCode: 404, statusMessage: '項目が見つかりません。' })
  return field
}

export async function validateSpotFieldSubmission(
  client: Prisma.TransactionClient,
  mapId: string,
  standardValues: Record<string, unknown>,
  customValues: Record<string, string | number | boolean | null>,
  spotId?: string,
) {
  const fields = await client.spotFieldDefinition.findMany({ where: { mapId } })
  const customFields = new Map(fields.filter(field => field.kind === 'custom').map(field => [field.id, field]))
  const existing = spotId
    ? await client.spotFieldValue.findMany({ where: { spotId }, select: { fieldDefinitionId: true, valueJson: true } })
    : []
  const existingValues = new Map(existing.map(value => [value.fieldDefinitionId, value.valueJson]))

  for (const [fieldId, value] of Object.entries(customValues)) {
    const field = customFields.get(fieldId)
    if (!field || !field.enabled) throw createError({ statusCode: 422, statusMessage: '有効なカスタム項目を指定してください。' })
    if (!validateCustomFieldValue(field.type, value)) {
      throw createError({ statusCode: 422, statusMessage: `${field.label}の値を確認してください。` })
    }
  }

  for (const field of fields.filter(field => field.enabled && field.required)) {
    const value = field.kind === 'standard'
      ? standardValues[field.semanticKey ?? '']
      : (Object.hasOwn(customValues, field.id) ? customValues[field.id] : existingValues.get(field.id))
    if (value === null || value === undefined || value === '') {
      throw createError({ statusCode: 422, statusMessage: `${field.label}は必須です。` })
    }
  }
  return customFields
}
