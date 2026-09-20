import type { SpotFieldDefinitionItem } from '../../shared/types/spot-field'
import type { StandardSpotFieldKey, SpotFieldType } from '../../shared/constants/spot-fields'
import type { Prisma } from '../../prisma/generated/client'
import { defaultSpotFieldDefinitions, standardSpotFieldKeys } from '../../shared/constants/spot-fields'
import { validateCustomFieldValue } from '../../shared/schemas/spot-field'
import { isMapLocale } from '../../shared/constants/map-languages'

type SpotFieldClient = Pick<Prisma.TransactionClient, 'spotFieldDefinition'>

export interface DefaultSpotFieldRepairResult {
  existingSemanticKeys: StandardSpotFieldKey[]
  createdSemanticKeys: StandardSpotFieldKey[]
  finalStandardCount: number
}

export interface DefaultSpotFieldInvariantResult {
  valid: boolean
  missingSemanticKeys: StandardSpotFieldKey[]
  duplicateSemanticKeys: StandardSpotFieldKey[]
  unexpectedStandardSemanticKeys: Array<string | null>
}

export function inspectDefaultSpotFieldInvariant(fields: Array<{ kind: string, semanticKey: string | null }>): DefaultSpotFieldInvariantResult {
  const standardFields = fields.filter(field => field.kind === 'standard')
  const counts = new Map<string, number>()
  for (const field of standardFields) {
    if (field.semanticKey) counts.set(field.semanticKey, (counts.get(field.semanticKey) ?? 0) + 1)
  }
  const missingSemanticKeys = standardSpotFieldKeys.filter(key => !counts.has(key))
  const duplicateSemanticKeys = standardSpotFieldKeys.filter(key => (counts.get(key) ?? 0) > 1)
  const allowed = new Set<string>(standardSpotFieldKeys)
  const unexpectedStandardSemanticKeys = standardFields
    .map(field => field.semanticKey)
    .filter(key => key === null || !allowed.has(key))
  return {
    valid: missingSemanticKeys.length === 0 && duplicateSemanticKeys.length === 0 && unexpectedStandardSemanticKeys.length === 0 && standardFields.length === standardSpotFieldKeys.length,
    missingSemanticKeys,
    duplicateSemanticKeys,
    unexpectedStandardSemanticKeys,
  }
}

export async function ensureDefaultSpotFieldDefinitions(client: SpotFieldClient, mapId: string): Promise<DefaultSpotFieldRepairResult> {
  const existing = await client.spotFieldDefinition.findMany({
    where: { mapId },
    select: { kind: true, semanticKey: true, order: true },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  })
  const allowed = new Set<string>(standardSpotFieldKeys)
  const existingSemanticKeys = existing
    .filter(field => field.kind === 'standard' && field.semanticKey && allowed.has(field.semanticKey))
    .map(field => field.semanticKey as StandardSpotFieldKey)
  const existingKeySet = new Set(existingSemanticKeys)
  const missing = defaultSpotFieldDefinitions.filter(field => !existingKeySet.has(field.semanticKey))
  const existingOrders = new Set(existing.map(field => field.order))
  const canonicalOrderCollides = missing.some(field => existingOrders.has(field.order))
  const maxOrder = existing.reduce((maximum, field) => Math.max(maximum, field.order), -1)
  const data = missing.map((field, index) => ({
    ...field,
    mapId,
    order: canonicalOrderCollides ? maxOrder + index + 1 : field.order,
  }))
  if (data.length) await client.spotFieldDefinition.createMany({ data, skipDuplicates: true })
  const finalFields = await client.spotFieldDefinition.findMany({
    where: { mapId, kind: 'standard', semanticKey: { in: [...standardSpotFieldKeys] } },
    select: { semanticKey: true },
  })
  return {
    existingSemanticKeys,
    createdSemanticKeys: missing.map(field => field.semanticKey),
    finalStandardCount: finalFields.length,
  }
}

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
