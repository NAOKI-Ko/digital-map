import type { Prisma } from '~~/prisma/generated/client'
import { encodeCsv, parseCsv } from '~~/lib/csv'
import { validateCustomFieldValue } from '~~/shared/schemas/spot-field'
import type { SpotCsvMessage, SpotCsvPreview } from '~~/shared/types/spot-csv'

type CsvField = { id: string, kind: string, semanticKey: string | null, label: string, type: string, enabled: boolean, required: boolean, order: number }
type CsvCategory = { id: string, name: string }

export interface ParsedSpotCsvRow {
  rowNumber: number
  name: string
  standardValues: Record<string, string>
  customValues: Record<string, string | number | boolean>
  englishName: string
  englishStandardValues: Record<string, string>
  englishCustomValues: Record<string, string>
  categoryIds: string[]
  messages: SpotCsvMessage[]
}

function fieldHeader(field: CsvField) {
  return field.kind === 'standard' ? `field:standard:${field.semanticKey}` : `field:custom:${field.id}`
}

const translatableStandardKeys = new Set(['description', 'address', 'hours', 'holiday'])
const translatableTextTypes = new Set(['single_line_text', 'multiline_text'])

function isTranslatableField(field: CsvField) {
  return field.kind === 'standard'
    ? Boolean(field.semanticKey && translatableStandardKeys.has(field.semanticKey))
    : translatableTextTypes.has(field.type)
}

export function createSpotCsvTemplate(fields: CsvField[], enabledLocales: string[] = ['ja']) {
  const enabled = fields.filter(field => field.enabled).toSorted((a, b) => a.order - b.order)
  const english = enabledLocales.includes('en') ? ['spot:name[en]', ...enabled.filter(isTranslatableField).map(field => `${fieldHeader(field)}[en]`)] : []
  return encodeCsv([
    ['spot:name', ...enabled.map(fieldHeader), 'categories', ...english],
    ['', ...enabled.map(() => ''), '', ...english.map(() => '')],
  ])
}

function parseTypedValue(field: CsvField, raw: string) {
  if (raw === '') return { value: '', valid: true }
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

export function previewSpotCsv(
  source: string,
  fields: CsvField[],
  categories: CsvCategory[],
  existingNames: string[],
  enabledLocales: string[] = ['ja'],
): { preview: SpotCsvPreview, parsedRows: ParsedSpotCsvRow[] } {
  const parsed = parseCsv(source)
  const enabledFields = fields.filter(field => field.enabled)
  const allowedFields = new Map(enabledFields.map(field => [fieldHeader(field), field]))
  const englishFields = new Map(enabledFields.filter(isTranslatableField).map(field => [`${fieldHeader(field)}[en]`, field]))
  const categoryByName = new Map(categories.map(category => [category.name, category.id]))
  if (parsed.error || parsed.rows.length === 0) {
    const message = parsed.error ?? 'ヘッダー行がありません。'
    return { preview: { total: 0, valid: 0, warnings: 0, errors: 1, rows: [{ rowNumber: 1, name: '', messages: [{ level: 'error', message }] }] }, parsedRows: [] }
  }

  const headers = parsed.rows[0]!
  const headerErrors: SpotCsvMessage[] = []
  if (headers[0] !== 'spot:name') headerErrors.push({ level: 'error', message: '先頭列はspot:nameである必要があります。' })
  if (new Set(headers).size !== headers.length) headerErrors.push({ level: 'error', message: '重複した列があります。' })
  for (const header of headers) {
    const isEnglish = header === 'spot:name[en]' || englishFields.has(header)
    if (isEnglish && !enabledLocales.includes('en')) headerErrors.push({ level: 'error', message: `無効なlocale列です: ${header}` })
    else if (header !== 'spot:name' && header !== 'categories' && !allowedFields.has(header) && !isEnglish) headerErrors.push({ level: 'error', message: `未対応の列です: ${header}` })
  }
  if (headerErrors.length) {
    return { preview: { total: 0, valid: 0, warnings: 0, errors: headerErrors.length, rows: [{ rowNumber: 1, name: '', messages: headerErrors }] }, parsedRows: [] }
  }

  const csvNameCounts = new Map<string, number>()
  for (const row of parsed.rows.slice(1)) {
    const name = row[0]?.trim() ?? ''
    if (name) csvNameCounts.set(name, (csvNameCounts.get(name) ?? 0) + 1)
  }
  const existingNameSet = new Set(existingNames)
  const parsedRows = parsed.rows.slice(1).map((cells, rowIndex): ParsedSpotCsvRow => {
    const rowNumber = rowIndex + 2
    const messages: SpotCsvMessage[] = []
    const name = cells[0]?.trim() ?? ''
    const standardValues: Record<string, string> = {}
    const customValues: Record<string, string | number | boolean> = {}
    const englishStandardValues: Record<string, string> = {}
    const englishCustomValues: Record<string, string> = {}
    let englishName = ''
    const categoryIds: string[] = []
    if (cells.length !== headers.length) messages.push({ level: 'error', message: `列数が不正です（${cells.length}/${headers.length}）。` })
    if (!name) messages.push({ level: 'error', message: 'Spot名は必須です。' })
    if (name && existingNameSet.has(name)) messages.push({ level: 'warning', message: '同名のSpotが既にあります。' })
    if (name && (csvNameCounts.get(name) ?? 0) > 1) messages.push({ level: 'warning', message: 'CSV内に同名のSpotがあります。' })

    headers.forEach((header, columnIndex) => {
      const raw = (cells[columnIndex] ?? '').trim()
      const field = allowedFields.get(header)
      const englishField = englishFields.get(header)
      if (field) {
        if (field.required && raw === '') messages.push({ level: 'error', message: `${field.label}は必須です。` })
        const typed = parseTypedValue(field, raw)
        if (!typed.valid) messages.push({ level: 'error', message: `${field.label}の値の形式が不正です。` })
        if (raw !== '') {
          if (field.kind === 'standard' && field.semanticKey) standardValues[field.semanticKey] = String(typed.value)
          else customValues[field.id] = typed.value as string | number | boolean
        }
      }
      if (header === 'spot:name[en]') englishName = raw
      if (englishField && raw) {
        if (englishField.kind === 'standard' && englishField.semanticKey) englishStandardValues[englishField.semanticKey] = raw
        else englishCustomValues[englishField.id] = raw
      }
      if (header === 'categories' && raw) {
        for (const categoryName of raw.split('|').map(value => value.trim()).filter(Boolean)) {
          const categoryId = categoryByName.get(categoryName)
          if (categoryId) categoryIds.push(categoryId)
          else messages.push({ level: 'error', message: `未登録のカテゴリーです: ${categoryName}` })
        }
      }
    })
    return { rowNumber, name, standardValues, customValues, englishName, englishStandardValues, englishCustomValues, categoryIds: [...new Set(categoryIds)], messages }
  })
  const rows = parsedRows.map(row => ({ rowNumber: row.rowNumber, name: row.name, messages: row.messages }))
  const errors = rows.reduce((count, row) => count + row.messages.filter(message => message.level === 'error').length, 0)
  const warnings = rows.reduce((count, row) => count + row.messages.filter(message => message.level === 'warning').length, 0)
  return { preview: { total: rows.length, valid: rows.filter(row => !row.messages.some(message => message.level === 'error')).length, warnings, errors, rows }, parsedRows }
}

export async function loadSpotCsvContext(client: Prisma.TransactionClient | typeof prisma, mapId: string, floorId: string) {
  const [map, floor, fields, categories, spots] = await Promise.all([
    client.map.findUnique({ where: { id: mapId }, select: { enabledLocales: true } }),
    client.mapFloor.findFirst({ where: { id: floorId, mapId }, select: { id: true } }),
    client.spotFieldDefinition.findMany({ where: { mapId }, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
    client.category.findMany({ where: { mapId }, select: { id: true, name: true } }),
    client.spot.findMany({ where: { floor: { mapId } }, select: { name: true } }),
  ])
  if (!floor) throw createError({ statusCode: 422, statusMessage: '対象フロアが見つかりません。' })
  return { floor, fields, categories, existingNames: spots.map(spot => spot.name), enabledLocales: map?.enabledLocales ?? ['ja'] }
}
