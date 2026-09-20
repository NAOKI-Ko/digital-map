import { createHash } from 'node:crypto'
import type { Prisma } from '~~/prisma/generated/client'
import { encodeCsv, parseCsv } from '~~/lib/csv'
import { validateCustomFieldValue } from '~~/shared/schemas/spot-field'
import type { SpotCsvClassification, SpotCsvFieldDiff, SpotCsvMessage, SpotCsvPreview, SpotCsvRowStatus } from '~~/shared/types/spot-csv'

export const SPOT_CSV_VERSION = '3'
export const SPOT_CSV_SYSTEM_HEADERS = ['__csvVersion', '__schemaVersion', '__spotId', '__rowVersion', '__floorId'] as const
const SPOT_CSV_V2_SYSTEM_HEADERS = ['__csvVersion', '__schemaVersion', '__spotId', '__rowVersion'] as const

type CsvField = { id: string, kind: string, semanticKey: string | null, label: string, type: string, enabled: boolean, required: boolean, order: number }
type CsvCategory = { id: string, name: string }
type CsvFloor = { id: string, name: string, order: number }
type CsvSpot = {
  id: string
  floorId: string
  name: string
  description: string | null
  address: string | null
  website: string | null
  hoursText: string | null
  holidayText: string | null
  phone: string | null
  spotCategories: { categoryId: string }[]
  fieldValues: { fieldDefinitionId: string, valueJson: unknown }[]
  translations: { locale: string, name: string | null, description: string | null, address: string | null, hoursText: string | null, holidayText: string | null }[]
  fieldValueTranslations: { fieldDefinitionId: string, locale: string, value: string }[]
}

export interface ParsedSpotCsvRow {
  rowNumber: number
  spotId: string | null
  suppliedRowVersion: string
  floorId: string | null
  floorName: string
  name: string
  standardValues: Record<string, string>
  customValues: Record<string, string | number | boolean | null>
  englishName: string
  englishStandardValues: Record<string, string>
  englishCustomValues: Record<string, string>
  categoryIds: string[]
  status: SpotCsvRowStatus
  classifications: SpotCsvClassification[]
  diffs: SpotCsvFieldDiff[]
  messages: SpotCsvMessage[]
}

export interface SpotCsvContext {
  floor?: { id: string }
  floors?: CsvFloor[]
  fields: CsvField[]
  categories: CsvCategory[]
  existingNames: string[]
  enabledLocales: string[]
  spots: CsvSpot[]
  schemaVersion: string
}

function fieldHeader(field: CsvField) {
  return field.kind === 'standard' ? `field:standard:${field.semanticKey}` : `field:custom:${field.id}`
}

const translatableStandardKeys = new Set(['description', 'address', 'hours', 'holiday'])
const translatableTextTypes = new Set(['single_line_text', 'multiline_text'])
const formulaPrefix = /^[=+\-@]/

function isTranslatableField(field: CsvField) {
  return field.kind === 'standard'
    ? Boolean(field.semanticKey && translatableStandardKeys.has(field.semanticKey))
    : translatableTextTypes.has(field.type)
}

/** Prefix formula-like values for spreadsheet display, doubling a real apostrophe to make decoding reversible. */
export function protectSpreadsheetValue(value: string) {
  if (formulaPrefix.test(value)) return `'${value}`
  if (/^'[=+\-@]/.test(value)) return `'${value}`
  return value
}

export function restoreSpreadsheetValue(value: string) {
  if (/^''[=+\-@]/.test(value)) return value.slice(1)
  if (/^'[=+\-@]/.test(value)) return value.slice(1)
  return value
}

function hashCanonical(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('base64url')
}

export function computeSpotCsvSchemaVersion(fields: CsvField[], enabledLocales: string[] = ['ja'], floors?: CsvFloor[]) {
  return hashCanonical({
    version: floors ? Number(SPOT_CSV_VERSION) : 2,
    locales: [...enabledLocales].sort(),
    fields: fields
      .map(field => ({ id: field.id, kind: field.kind, semanticKey: field.semanticKey, type: field.type, enabled: field.enabled, required: field.required, ...(floors ? { order: field.order, label: field.label } : {}) }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    ...(floors ? { floors: floors.map(floor => ({ id: floor.id, name: floor.name, order: floor.order })).toSorted((a, b) => a.order - b.order || a.id.localeCompare(b.id)) } : {}),
  })
}

function enabledFields(fields: CsvField[]) {
  return fields.filter(field => field.enabled).toSorted((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}

function dataHeaders(fields: CsvField[], enabledLocales: string[]) {
  const enabled = enabledFields(fields)
  const english = enabledLocales.includes('en')
    ? ['spot:name[en]', ...enabled.filter(isTranslatableField).map(field => `${fieldHeader(field)}[en]`)]
    : []
  return ['spot:name', ...enabled.map(fieldHeader), 'categories', ...english]
}

const standardJapaneseLabels: Record<string, string> = {
  description: '説明', address: '住所', phone: '電話番号', website: 'Webサイト', hours: '営業時間', holiday: '定休日',
}

type V3Column = { header: string, field?: CsvField, english?: boolean, kind: 'floor' | 'name' | 'field' | 'categories' }

function uniqueHumanLabel(label: string, counts: Map<string, number>) {
  const count = (counts.get(label) ?? 0) + 1
  counts.set(label, count)
  return count === 1 ? label : `${label}（${count}）`
}

export function spotCsvV3Columns(fields: CsvField[], enabledLocales: string[]): V3Column[] {
  const counts = new Map<string, number>()
  const columns: V3Column[] = [{ header: 'フロア', kind: 'floor' }, { header: 'スポット名', kind: 'name' }]
  for (const field of enabledFields(fields)) {
    const base = field.kind === 'standard' && field.semanticKey ? (standardJapaneseLabels[field.semanticKey] ?? field.label) : field.label
    columns.push({ header: uniqueHumanLabel(base, counts), kind: 'field', field })
  }
  columns.push({ header: 'カテゴリー', kind: 'categories' })
  if (enabledLocales.includes('en')) {
    columns.push({ header: 'スポット名（英語）', kind: 'name', english: true })
    for (const field of enabledFields(fields).filter(isTranslatableField)) {
      const japanese = columns.find(column => column.field?.id === field.id && !column.english)?.header ?? field.label
      columns.push({ header: `${japanese}（英語）`, kind: 'field', field, english: true })
    }
  }
  return columns
}

export function createSpotCsvTemplate(fields: CsvField[], enabledLocales: string[] = ['ja']) {
  const headers = dataHeaders(fields, enabledLocales)
  return encodeCsv([headers, headers.map(() => '')])
}

function spotEditableState(spot: CsvSpot, fields: CsvField[]) {
  const enabled = enabledFields(fields)
  const customIds = new Set(enabled.filter(field => field.kind === 'custom').map(field => field.id))
  const english = spot.translations.find(translation => translation.locale === 'en')
  return {
    name: spot.name,
    standard: {
      description: spot.description ?? '',
      address: spot.address ?? '',
      website: spot.website ?? '',
      hours: spot.hoursText ?? '',
      holiday: spot.holidayText ?? '',
      phone: spot.phone ?? '',
    },
    custom: Object.fromEntries(spot.fieldValues
      .filter(value => customIds.has(value.fieldDefinitionId))
      .map(value => [value.fieldDefinitionId, value.valueJson] as [string, unknown])
      .sort(([a], [b]) => a.localeCompare(b))),
    english: {
      name: english?.name ?? '',
      description: english?.description ?? '',
      address: english?.address ?? '',
      hours: english?.hoursText ?? '',
      holiday: english?.holidayText ?? '',
      custom: Object.fromEntries(spot.fieldValueTranslations
        .filter(value => value.locale === 'en' && customIds.has(value.fieldDefinitionId))
        .map(value => [value.fieldDefinitionId, value.value] as [string, string])
        .sort(([a], [b]) => a.localeCompare(b))),
    },
    categories: spot.spotCategories.map(item => item.categoryId).sort(),
  }
}

export function computeSpotCsvRowVersion(spot: CsvSpot, fields: CsvField[], enabledLocales: string[] = ['ja']) {
  const state = spotEditableState(spot, fields)
  const standardKeys = enabledFields(fields).filter(field => field.kind === 'standard' && field.semanticKey).map(field => field.semanticKey!)
  const translatableKeys = enabledFields(fields).filter(field => field.kind === 'standard' && field.semanticKey && isTranslatableField(field)).map(field => field.semanticKey!)
  return hashCanonical({
    name: state.name,
    standard: Object.fromEntries(standardKeys.map(key => [key, state.standard[key as keyof typeof state.standard]])),
    custom: state.custom,
    english: enabledLocales.includes('en') ? {
      name: state.english.name,
      standard: Object.fromEntries(translatableKeys.map(key => [key, state.english[key as keyof Omit<typeof state.english, 'custom'>]])),
      custom: state.english.custom,
    } : null,
    categories: state.categories,
  })
}

function stateCellValues(spot: CsvSpot, fields: CsvField[], categories: CsvCategory[], enabledLocales: string[]) {
  const state = spotEditableState(spot, fields)
  const categoryNames = new Map(categories.map(category => [category.id, category.name]))
  const values: string[] = [state.name]
  for (const field of enabledFields(fields)) {
    const value = field.kind === 'standard' && field.semanticKey
      ? state.standard[field.semanticKey as keyof typeof state.standard]
      : state.custom[field.id]
    values.push(value === undefined || value === null ? '' : String(value))
  }
  values.push(state.categories.map(id => categoryNames.get(id) ?? '').filter(Boolean).join('|'))
  if (enabledLocales.includes('en')) {
    values.push(state.english.name)
    for (const field of enabledFields(fields).filter(isTranslatableField)) {
      const value = field.kind === 'standard' && field.semanticKey
        ? state.english[field.semanticKey as keyof Omit<typeof state.english, 'custom'>]
        : state.english.custom[field.id]
      values.push(value === undefined || value === null ? '' : String(value))
    }
  }
  return values.map(protectSpreadsheetValue)
}

export function createSpotCsvExport(context: SpotCsvContext) {
  if (context.floors) {
    const columns = spotCsvV3Columns(context.fields, context.enabledLocales)
    const headers = [...columns.map(column => column.header), ...SPOT_CSV_SYSTEM_HEADERS]
    const floorById = new Map(context.floors.map(floor => [floor.id, floor]))
    const categoryNames = new Map(context.categories.map(category => [category.id, category.name]))
    const rows = context.spots
      .toSorted((a, b) => (floorById.get(a.floorId)?.order ?? 0) - (floorById.get(b.floorId)?.order ?? 0) || a.name.localeCompare(b.name, 'ja') || a.id.localeCompare(b.id))
      .map((spot) => {
        const state = spotEditableState(spot, context.fields)
        const values = columns.map((column) => {
          if (column.kind === 'floor') return floorById.get(spot.floorId)?.name ?? ''
          if (column.kind === 'name') return column.english ? state.english.name : state.name
          if (column.kind === 'categories') return state.categories.map(id => categoryNames.get(id) ?? '').filter(Boolean).join('|')
          const field = column.field!
          if (column.english) return field.kind === 'standard' && field.semanticKey ? state.english[field.semanticKey as keyof Omit<typeof state.english, 'custom'>] : state.english.custom[field.id]
          return field.kind === 'standard' && field.semanticKey ? state.standard[field.semanticKey as keyof typeof state.standard] : state.custom[field.id]
        }).map(value => protectSpreadsheetValue(value === undefined || value === null ? '' : String(value)))
        return [...values, SPOT_CSV_VERSION, context.schemaVersion, spot.id, computeSpotCsvRowVersion(spot, context.fields, context.enabledLocales), spot.floorId]
      })
    return encodeCsv([headers, ...rows])
  }
  const headers = [...SPOT_CSV_V2_SYSTEM_HEADERS, ...dataHeaders(context.fields, context.enabledLocales)]
  const rows = context.spots
    .filter(spot => spot.floorId === context.floor!.id)
    .toSorted((a, b) => a.name.localeCompare(b.name, 'ja') || a.id.localeCompare(b.id))
    .map(spot => ['2', context.schemaVersion, spot.id, computeSpotCsvRowVersion(spot, context.fields, context.enabledLocales), ...stateCellValues(spot, context.fields, context.categories, context.enabledLocales)])
  return encodeCsv([headers, ...rows])
}

function parseTypedValue(field: CsvField, raw: string) {
  if (raw === '') return { value: null, valid: true }
  if (field.type === 'number') {
    const value = Number(raw)
    return { value, valid: Number.isFinite(value) }
  }
  if (field.type === 'boolean') {
    const normalized = raw.trim().toLowerCase()
    if (['true', '1', 'はい'].includes(normalized)) return { value: true, valid: true }
    if (['false', '0', 'いいえ'].includes(normalized)) return { value: false, valid: true }
    return { value: raw, valid: false }
  }
  return { value: raw, valid: validateCustomFieldValue(field.type, raw) }
}

function emptyPreview(version: 1 | 2 | 3, message: string): { preview: SpotCsvPreview, parsedRows: ParsedSpotCsvRow[] } {
  return {
    preview: {
      version, total: 0, valid: 0, newCount: 0, updateCount: 0, unchangedCount: 0, warnings: 0, conflicts: 0, errors: 1,
      rows: [{ rowNumber: 1, spotId: null, name: '', status: 'ERROR', classifications: ['ERROR'], diffs: [], messages: [{ level: 'error', message }] }],
    },
    parsedRows: [],
  }
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '（空）'
  if (Array.isArray(value)) return value.join(' | ') || '（空）'
  return String(value)
}

function compareStates(oldState: ReturnType<typeof spotEditableState>, nextState: ReturnType<typeof spotEditableState>, fields: CsvField[], categories: CsvCategory[]) {
  const diffs: SpotCsvFieldDiff[] = []
  const add = (field: string, oldValue: unknown, newValue: unknown) => {
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) diffs.push({ field, oldValue: displayValue(oldValue), newValue: displayValue(newValue) })
  }
  add('name', oldState.name, nextState.name)
  for (const field of enabledFields(fields)) {
    const oldValue = field.kind === 'standard' && field.semanticKey ? oldState.standard[field.semanticKey as keyof typeof oldState.standard] : oldState.custom[field.id]
    const newValue = field.kind === 'standard' && field.semanticKey ? nextState.standard[field.semanticKey as keyof typeof nextState.standard] : nextState.custom[field.id]
    add(field.label, oldValue ?? '', newValue ?? '')
    if (isTranslatableField(field)) {
      const oldEnglish = field.kind === 'standard' && field.semanticKey ? oldState.english[field.semanticKey as keyof Omit<typeof oldState.english, 'custom'>] : oldState.english.custom[field.id]
      const newEnglish = field.kind === 'standard' && field.semanticKey ? nextState.english[field.semanticKey as keyof Omit<typeof nextState.english, 'custom'>] : nextState.english.custom[field.id]
      add(`${field.label} [en]`, oldEnglish ?? '', newEnglish ?? '')
    }
  }
  add('name [en]', oldState.english.name, nextState.english.name)
  const categoryById = new Map(categories.map(category => [category.id, category.name]))
  const oldCategoryIds = new Set(oldState.categories)
  const nextCategoryIds = new Set(nextState.categories)
  const added = nextState.categories.filter(id => !oldCategoryIds.has(id)).map(id => categoryById.get(id) ?? id)
  const removed = oldState.categories.filter(id => !nextCategoryIds.has(id)).map(id => categoryById.get(id) ?? id)
  if (added.length) diffs.push({ field: 'Categories 追加', oldValue: '（なし）', newValue: added.join(' | ') })
  if (removed.length) diffs.push({ field: 'Categories 削除', oldValue: removed.join(' | '), newValue: '（なし）' })
  return diffs
}

function nextEditableState(spot: CsvSpot, row: ParsedSpotCsvRow, fields: CsvField[]) {
  const next = structuredClone(spotEditableState(spot, fields))
  next.name = row.name
  for (const field of enabledFields(fields)) {
    if (field.kind === 'standard' && field.semanticKey) next.standard[field.semanticKey as keyof typeof next.standard] = row.standardValues[field.semanticKey] ?? ''
    else {
      const value = row.customValues[field.id]
      if (value === null || value === undefined || value === '') delete next.custom[field.id]
      else next.custom[field.id] = value
    }
  }
  next.categories = [...row.categoryIds].sort()
  next.english.name = row.englishName
  for (const field of enabledFields(fields).filter(isTranslatableField)) {
    if (field.kind === 'standard' && field.semanticKey) next.english[field.semanticKey as keyof Omit<typeof next.english, 'custom'>] = row.englishStandardValues[field.semanticKey] ?? ''
    else {
      const value = row.englishCustomValues[field.id]
      if (!value) delete next.english.custom[field.id]
      else next.english.custom[field.id] = value
    }
  }
  return next
}

export function previewSpotCsv(
  source: string,
  fields: CsvField[],
  categories: CsvCategory[],
  existingNames: string[],
  enabledLocales: string[] = ['ja'],
  spots: CsvSpot[] = [],
  floorId?: string,
  floors?: CsvFloor[],
): { preview: SpotCsvPreview, parsedRows: ParsedSpotCsvRow[] } {
  const parsed = parseCsv(source)
  if (parsed.error || parsed.rows.length === 0) return emptyPreview(1, parsed.error ?? 'ヘッダー行がありません。')
  const headers = parsed.rows[0]!
  const hasSystemHeader = headers.some(header => header.startsWith('__'))
  const csvVersionIndex = headers.indexOf('__csvVersion')
  const declaredVersion = csvVersionIndex >= 0 ? parsed.rows[1]?.[csvVersionIndex]?.trim() : ''
  const version: 1 | 2 | 3 = declaredVersion === SPOT_CSV_VERSION ? 3 : hasSystemHeader ? 2 : 1
  const enabled = enabledFields(fields)
  const allowedFields = new Map(enabled.map(field => [fieldHeader(field), field]))
  const englishFields = new Map(enabled.filter(isTranslatableField).map(field => [`${fieldHeader(field)}[en]`, field]))
  const v3Columns = spotCsvV3Columns(fields, enabledLocales)
  const v3ColumnByHeader = new Map(v3Columns.map(column => [column.header, column]))
  const categoryByName = new Map(categories.map(category => [category.name, category.id]))
  const headerErrors: SpotCsvMessage[] = []
  if (new Set(headers).size !== headers.length) headerErrors.push({ level: 'error', message: '重複した列があります。' })
  if (version === 1 && headers[0] !== 'spot:name') headerErrors.push({ level: 'error', message: '先頭列はspot:nameである必要があります。' })
  if (version === 2) {
    for (const systemHeader of SPOT_CSV_V2_SYSTEM_HEADERS) if (!headers.includes(systemHeader)) headerErrors.push({ level: 'error', message: `必須システム列がありません: ${systemHeader}` })
    for (const requiredHeader of dataHeaders(fields, enabledLocales)) if (!headers.includes(requiredHeader)) headerErrors.push({ level: 'error', message: `v2 CSVの必須列がありません: ${requiredHeader}` })
  }
  if (version === 3) {
    if (!floors) headerErrors.push({ level: 'error', message: 'このCSVはマップ全体の取込画面で確認してください。' })
    for (const header of [...v3Columns.map(column => column.header), ...SPOT_CSV_SYSTEM_HEADERS]) if (!headers.includes(header)) headerErrors.push({ level: 'error', message: `v3 CSVの必須列がありません: ${header}` })
    const lastHumanIndex = Math.max(...v3Columns.map(column => headers.indexOf(column.header)))
    const firstSystemIndex = Math.min(...SPOT_CSV_SYSTEM_HEADERS.map(header => headers.indexOf(header)).filter(index => index >= 0))
    if (firstSystemIndex <= lastHumanIndex) headerErrors.push({ level: 'error', message: 'システム管理用の列はCSVの末尾から移動しないでください。' })
  } else {
    for (const header of headers) {
      if ((SPOT_CSV_V2_SYSTEM_HEADERS as readonly string[]).includes(header)) continue
      const isEnglish = header === 'spot:name[en]' || englishFields.has(header)
      if (isEnglish && !enabledLocales.includes('en')) headerErrors.push({ level: 'error', message: `無効なlocale列です: ${header}` })
      else if (header !== 'spot:name' && header !== 'categories' && !allowedFields.has(header) && !isEnglish) headerErrors.push({ level: 'error', message: `未対応の列です: ${header}` })
    }
  }
  if (version === 3) {
    for (const header of headers) if (!(SPOT_CSV_SYSTEM_HEADERS as readonly string[]).includes(header) && !v3ColumnByHeader.has(header)) headerErrors.push({ level: 'error', message: `未対応の列です: ${header}` })
  }
  if (headerErrors.length) {
    const result = emptyPreview(version, headerErrors[0]!.message)
    result.preview.errors = headerErrors.length
    result.preview.rows[0]!.messages = headerErrors
    return result
  }

  const headerIndex = new Map(headers.map((header, index) => [header, index]))
  const rawCell = (cells: string[], header: string) => cells[headerIndex.get(header) ?? -1] ?? ''
  const dataCell = (cells: string[], header: string) => version >= 2 ? restoreSpreadsheetValue(rawCell(cells, header)) : rawCell(cells, header).trim()
  const nameHeader = version === 3 ? 'スポット名' : 'spot:name'
  const categoryHeader = version === 3 ? 'カテゴリー' : 'categories'
  const floorById = new Map((floors ?? []).map(floor => [floor.id, floor]))
  const floorsByName = new Map<string, CsvFloor[]>()
  for (const currentFloor of floors ?? []) floorsByName.set(currentFloor.name, [...(floorsByName.get(currentFloor.name) ?? []), currentFloor])
  const csvNameCounts = new Map<string, number>()
  const spotIdCounts = new Map<string, number>()
  for (const cells of parsed.rows.slice(1)) {
    const name = dataCell(cells, nameHeader).trim()
    const spotId = rawCell(cells, '__spotId').trim()
    if (name) csvNameCounts.set(name, (csvNameCounts.get(name) ?? 0) + 1)
    if (spotId) spotIdCounts.set(spotId, (spotIdCounts.get(spotId) ?? 0) + 1)
  }
  const existingNameSet = new Set(existingNames)
  const spotById = new Map(spots.map(spot => [spot.id, spot]))
  const schemaVersion = computeSpotCsvSchemaVersion(fields, enabledLocales, version === 3 ? floors : undefined)

  const parsedRows = parsed.rows.slice(1).map((cells, rowIndex): ParsedSpotCsvRow => {
    const rowNumber = rowIndex + 2
    const messages: SpotCsvMessage[] = []
    const name = dataCell(cells, nameHeader).trim()
    const spotIdValue = rawCell(cells, '__spotId').trim()
    const spotId = spotIdValue || null
    const suppliedRowVersion = rawCell(cells, '__rowVersion').trim()
    const suppliedFloorId = rawCell(cells, '__floorId').trim()
    const floorName = version === 3 ? dataCell(cells, 'フロア').trim() : (floorById.get(spotById.get(spotIdValue)?.floorId ?? floorId ?? '')?.name ?? '')
    let resolvedFloorId: string | null = floorId ?? null
    const standardValues: Record<string, string> = {}
    const customValues: Record<string, string | number | boolean | null> = {}
    const englishStandardValues: Record<string, string> = {}
    const englishCustomValues: Record<string, string> = {}
    let englishName = ''
    const categoryIds: string[] = []
    if (cells.length !== headers.length) messages.push({ level: 'error', message: `列数が不正です（${cells.length}/${headers.length}）。` })
    if (!name) messages.push({ level: 'error', message: 'Spot名は必須です。' })
    if (name.length > 100) messages.push({ level: 'error', message: 'Spot名は100文字以内で入力してください。' })
    if (name && existingNameSet.has(name) && (!spotId || spotById.get(spotId)?.name !== name)) messages.push({ level: 'warning', message: '同名のSpotが既にあります。' })
    if (name && (csvNameCounts.get(name) ?? 0) > 1) messages.push({ level: 'warning', message: 'CSV内に同名のSpotがあります。' })

    if (version >= 2) {
      if (rawCell(cells, '__csvVersion').trim() !== String(version)) messages.push({ level: 'error', message: '__csvVersionが不正です。' })
      const suppliedSchemaVersion = rawCell(cells, '__schemaVersion').trim()
      if (!suppliedSchemaVersion) messages.push({ level: 'error', message: '__schemaVersionは必須です。' })
      else if (suppliedSchemaVersion !== schemaVersion) messages.push({ level: 'conflict', message: '項目構成がExport時から変更されています。最新CSVを再Exportしてください。' })
      if (spotId && !suppliedRowVersion) messages.push({ level: 'error', message: '既存Spotには__rowVersionが必要です。' })
      if (!spotId && suppliedRowVersion) messages.push({ level: 'error', message: '新規行の__rowVersionは空欄にしてください。' })
      if (spotId && (spotIdCounts.get(spotId) ?? 0) > 1) messages.push({ level: 'error', message: `同じSpot IDがCSV内に複数あります: ${spotId}` })
      const existing = spotId ? spotById.get(spotId) : undefined
      if (spotId && !existing) messages.push({ level: 'error', message: 'Spot IDが存在しないか、対象Mapに属していません。' })
      else if (existing && floorId && existing.floorId !== floorId) messages.push({ level: 'error', message: 'Spot IDが選択したFloorに属していません。' })
      else if (existing && suppliedRowVersion && suppliedRowVersion !== computeSpotCsvRowVersion(existing, fields, enabledLocales)) messages.push({ level: 'conflict', message: 'SpotがExport後に変更されています。最新CSVを再Exportしてください。' })
      if (version === 2 && !floorId && floors && !existing) messages.push({ level: 'error', message: 'このCSVは旧形式です。最新のCSVを書き出してから編集してください。' })
      if (version === 2 && existing) resolvedFloorId = existing.floorId
      if (version === 3) {
        if (existing) {
          resolvedFloorId = existing.floorId
          const canonicalFloor = floorById.get(existing.floorId)
          if (suppliedFloorId !== existing.floorId || floorName !== canonicalFloor?.name) messages.push({ level: 'error', message: '既存スポットのフロア変更はCSVではできません。マップ上で変更してください。' })
        } else {
          const matches = floorsByName.get(floorName) ?? []
          if (!floorName) messages.push({ level: 'error', message: '新規スポットのフロアは必須です。' })
          else if (matches.length === 0) messages.push({ level: 'error', message: `フロアが見つかりません: ${floorName}` })
          else if (matches.length > 1) messages.push({ level: 'error', message: `同名のフロアが複数あるため特定できません: ${floorName}` })
          else {
            resolvedFloorId = matches[0]!.id
            if (suppliedFloorId && suppliedFloorId !== resolvedFloorId) messages.push({ level: 'error', message: 'フロア名と__floorIdが一致しません。' })
          }
        }
      }
    }

    if (version === 1 && !floorId && floors) messages.push({ level: 'error', message: 'このCSVは旧形式です。最新のCSVを書き出してから編集してください。' })

    for (const field of enabled) {
      if (version === 1 && !headerIndex.has(fieldHeader(field))) continue
      const v3Header = v3Columns.find(column => column.field?.id === field.id && !column.english)?.header
      const raw = dataCell(cells, version === 3 ? (v3Header ?? field.label) : fieldHeader(field))
      if (field.required && raw === '') messages.push({ level: 'error', message: `${field.label}は必須です。` })
      const typed = parseTypedValue(field, raw)
      if (!typed.valid) messages.push({ level: 'error', message: `${field.label}の値の形式が不正です。` })
      if (field.kind === 'standard' && field.semanticKey) standardValues[field.semanticKey] = typed.value === null ? '' : String(typed.value)
      else customValues[field.id] = typed.value as string | number | boolean | null
    }
    englishName = dataCell(cells, version === 3 ? 'スポット名（英語）' : 'spot:name[en]')
    for (const [header, field] of englishFields) {
      const v3Header = v3Columns.find(column => column.field?.id === field.id && column.english)?.header
      const raw = dataCell(cells, version === 3 ? (v3Header ?? header) : header)
      if (field.kind === 'standard' && field.semanticKey) englishStandardValues[field.semanticKey] = raw
      else englishCustomValues[field.id] = raw
    }
    const categoryRaw = dataCell(cells, categoryHeader)
    if (categoryRaw) {
      for (const categoryName of categoryRaw.split('|').map(value => value.trim()).filter(Boolean)) {
        const categoryId = categoryByName.get(categoryName)
        if (categoryId) categoryIds.push(categoryId)
        else messages.push({ level: 'error', message: `未登録のカテゴリーです: ${categoryName}` })
      }
    }
    const row: ParsedSpotCsvRow = { rowNumber, spotId, suppliedRowVersion, floorId: resolvedFloorId, floorName, name, standardValues, customValues, englishName, englishStandardValues, englishCustomValues, categoryIds: [...new Set(categoryIds)], status: 'NEW', classifications: ['NEW'], diffs: [], messages }
    const existing = spotId ? spotById.get(spotId) : undefined
    if (existing && !messages.some(message => message.level !== 'warning')) {
      row.diffs = compareStates(spotEditableState(existing, fields), nextEditableState(existing, row, fields), fields, categories)
      row.status = row.diffs.length ? 'UPDATE' : 'UNCHANGED'
    }
    if (messages.some(message => message.level === 'error')) row.status = 'ERROR'
    else if (messages.some(message => message.level === 'conflict')) row.status = 'CONFLICT'
    row.classifications = [row.status, ...(messages.some(message => message.level === 'warning') ? ['WARNING' as const] : [])]
    return row
  })
  const rows = parsedRows.map(row => ({ rowNumber: row.rowNumber, spotId: row.spotId, name: row.name, floorName: row.floorName, status: row.status, classifications: row.classifications, diffs: row.diffs, messages: row.messages }))
  const errors = rows.reduce((count, row) => count + row.messages.filter(message => message.level === 'error').length, 0)
  const warnings = rows.reduce((count, row) => count + row.messages.filter(message => message.level === 'warning').length, 0)
  const conflicts = rows.reduce((count, row) => count + row.messages.filter(message => message.level === 'conflict').length, 0)
  return {
    preview: {
      version,
      total: rows.length,
      valid: rows.filter(row => row.status !== 'ERROR' && row.status !== 'CONFLICT').length,
      newCount: rows.filter(row => row.status === 'NEW').length,
      updateCount: rows.filter(row => row.status === 'UPDATE').length,
      unchangedCount: rows.filter(row => row.status === 'UNCHANGED').length,
      warnings, conflicts, errors, rows,
    },
    parsedRows,
  }
}

export async function loadSpotCsvContext(client: Prisma.TransactionClient | typeof prisma, mapId: string, floorId?: string): Promise<SpotCsvContext> {
  const [map, floors, fields, categories, spots] = await Promise.all([
    client.map.findUnique({ where: { id: mapId }, select: { enabledLocales: true } }),
    client.mapFloor.findMany({ where: { mapId }, select: { id: true, name: true, order: true }, orderBy: [{ order: 'asc' }, { id: 'asc' }] }),
    client.spotFieldDefinition.findMany({ where: { mapId }, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
    client.category.findMany({ where: { mapId }, select: { id: true, name: true } }),
    client.spot.findMany({
      where: { floor: { mapId } },
      select: {
        id: true, floorId: true, name: true, description: true, address: true, website: true, hoursText: true, holidayText: true, phone: true,
        spotCategories: { select: { categoryId: true } },
        fieldValues: { select: { fieldDefinitionId: true, valueJson: true } },
        translations: { select: { locale: true, name: true, description: true, address: true, hoursText: true, holidayText: true } },
        fieldValueTranslations: { select: { fieldDefinitionId: true, locale: true, value: true } },
      },
    }),
  ])
  const floor = floorId ? floors.find(candidate => candidate.id === floorId) : undefined
  if (!map || (floorId && !floor)) throw createError({ statusCode: 422, statusMessage: '対象フロアが見つかりません。' })
  return {
    ...(floor ? { floor: { id: floor.id } } : { floors }),
    fields,
    categories,
    existingNames: spots.map(spot => spot.name),
    enabledLocales: map.enabledLocales,
    spots,
    schemaVersion: computeSpotCsvSchemaVersion(fields, map.enabledLocales, floor ? undefined : floors),
  }
}
