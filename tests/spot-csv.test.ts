import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { encodeCsv, parseCsv } from '../lib/csv'
import {
  computeSpotCsvRowVersion,
  computeSpotCsvSchemaVersion,
  createSpotCsvExport,
  createSpotCsvTemplate,
  previewSpotCsv,
  protectSpreadsheetValue,
  restoreSpreadsheetValue,
} from '../server/utils/spot-csv'

const fields = [
  { id: 'description-id', kind: 'standard', semanticKey: 'description', label: '紹介', type: 'multiline_text', enabled: true, required: true, order: 0 },
  { id: 'custom-number', kind: 'custom', semanticKey: null, label: '席数', type: 'number', enabled: true, required: false, order: 1 },
  { id: 'disabled', kind: 'custom', semanticKey: null, label: '非表示', type: 'single_line_text', enabled: false, required: false, order: 2 },
]
const categories = [{ id: 'cat-a', name: '観光' }, { id: 'cat-b', name: '飲食' }]
const existingSpot = {
  id: 'spot-a',
  floorId: 'floor-a',
  name: 'Cafe',
  description: '=1+1, "引用"\n2行目',
  address: null,
  website: null,
  hoursText: null,
  holidayText: null,
  phone: null,
  spotCategories: [{ categoryId: 'cat-a' }],
  fieldValues: [{ fieldDefinitionId: 'custom-number', valueJson: 12 }],
  translations: [{ locale: 'en', name: 'Cafe EN', description: 'About', address: null, hoursText: null, holidayText: null }],
  fieldValueTranslations: [],
}

function v2Context(spots = [existingSpot], fieldList = fields, locales = ['ja', 'en']) {
  return {
    floor: { id: 'floor-a' },
    fields: fieldList,
    categories,
    existingNames: spots.map(spot => spot.name),
    enabledLocales: locales,
    spots,
    schemaVersion: computeSpotCsvSchemaVersion(fieldList, locales),
  }
}

describe('Spot CSV', () => {
  it('BOM付きテンプレートが安定キーを使い、現在無効な項目を含まない', () => {
    const csv = createSpotCsvTemplate(fields)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('spot:name,field:standard:description,field:custom:custom-number,categories')
    expect(csv).not.toContain('disabled')
  })

  it('テンプレート形式を複数カテゴリーとCustom number付きで往復する', () => {
    const csv = '\uFEFFspot:name,field:standard:description,field:custom:custom-number,categories\r\nCafe,紹介文,12,観光|飲食\r\n'
    const result = previewSpotCsv(csv, fields, categories, [])
    expect(result.preview).toMatchObject({ total: 1, valid: 1, errors: 0 })
    expect(result.parsedRows[0]).toMatchObject({ name: 'Cafe', standardValues: { description: '紹介文' }, customValues: { 'custom-number': 12 }, categoryIds: ['cat-a', 'cat-b'] })
  })

  it('必須・未知カテゴリー・型不一致はエラーとして全体登録をブロックする', () => {
    const csv = 'spot:name,field:standard:description,field:custom:custom-number,categories\nCafe,,abc,未知\n'
    const result = previewSpotCsv(csv, fields, categories, [])
    expect(result.preview.errors).toBe(3)
    expect(result.preview.valid).toBe(0)
  })

  it('既存同名とCSV内重複は許容される警告にする', () => {
    const csv = 'spot:name,field:standard:description,categories\nCafe,紹介,観光\nCafe,紹介,\n'
    const result = previewSpotCsv(csv, fields, categories, ['Cafe'])
    expect(result.preview).toMatchObject({ total: 2, valid: 2, warnings: 4, errors: 0 })
  })

  it('列数不一致を構造エラーにする', () => {
    const result = previewSpotCsv('spot:name,categories\nCafe\n', fields, categories, [])
    expect(result.preview.errors).toBe(1)
  })

  it('英語有効時だけ安定ID付き[en]列を生成・取込し、旧形式も維持する', () => {
    const textFields = [...fields, { id: 'custom-text', kind: 'custom', semanticKey: null, label: '備考', type: 'single_line_text', enabled: true, required: false, order: 3 }]
    const template = createSpotCsvTemplate(textFields, ['ja', 'en'])
    expect(template).toContain('spot:name[en]')
    expect(template).toContain('field:standard:description[en]')
    expect(template).toContain('field:custom:custom-text[en]')
    expect(template).not.toContain('field:custom:custom-number[en]')
    const csv = 'spot:name,field:standard:description,categories,spot:name[en],field:standard:description[en],field:custom:custom-text[en]\n店,紹介,観光,Shop,About,Note\n'
    const result = previewSpotCsv(csv, textFields, categories, [], ['ja', 'en'])
    expect(result.preview.errors).toBe(0)
    expect(result.parsedRows[0]).toMatchObject({ englishName: 'Shop', englishStandardValues: { description: 'About' }, englishCustomValues: { 'custom-text': 'Note' } })
    expect(previewSpotCsv('spot:name,categories\n店,観光\n', textFields, categories, [], ['ja', 'en']).preview.valid).toBe(1)
  })

  it('無効なlocale suffixを拒否する', () => {
    expect(previewSpotCsv('spot:name,spot:name[fr]\n店,Boutique\n', fields, categories, [], ['ja', 'en']).preview.errors).toBeGreaterThan(0)
    expect(previewSpotCsv('spot:name,spot:name[en]\n店,Shop\n', fields, categories, [], ['ja']).preview.errors).toBeGreaterThan(0)
  })

  it('v2 ExportはBOM・RFC4180・system列・formula保護を保ち、無編集でUNCHANGEDになる', () => {
    const context = v2Context()
    const csv = createSpotCsvExport(context)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('__csvVersion,__schemaVersion,__spotId,__rowVersion')
    expect(csv).toContain('"\'=1+1, ""引用""\n2行目"')
    expect(csv).toContain("'=1+1")
    const result = previewSpotCsv(csv, fields, categories, ['Cafe'], ['ja', 'en'], [existingSpot], 'floor-a')
    expect(result.preview).toMatchObject({ version: 2, total: 1, unchangedCount: 1, updateCount: 0, conflicts: 0, errors: 0 })
    expect(result.parsedRows[0]?.standardValues.description).toBe('=1+1, "引用"\n2行目')
  })

  it('formula-like値と先頭apostropheを可逆に保護する', () => {
    for (const value of ['=SUM(A1:A2)', '+1', '-2', '@name', "'=literal", 'plain']) {
      expect(restoreSpreadsheetValue(protectSpreadsheetValue(value))).toBe(value)
    }
  })

  it('v2はIDで同名Spotを独立判定し、標準・Custom・英語・Categoryのdiffを示す', () => {
    const second = { ...existingSpot, id: 'spot-b', name: 'Cafe', description: '別の説明', spotCategories: [{ categoryId: 'cat-b' }] }
    const context = v2Context([existingSpot, second])
    const parsed = parseCsv(createSpotCsvExport(context)).rows
    const headers = parsed[0]!
    const first = parsed.find(row => row[headers.indexOf('__spotId')] === 'spot-a')!
    first[headers.indexOf('field:standard:description')] = '更新後'
    first[headers.indexOf('field:custom:custom-number')] = '20'
    first[headers.indexOf('categories')] = '飲食'
    first[headers.indexOf('spot:name[en]')] = 'Updated EN'
    const result = previewSpotCsv(encodeCsv(parsed), fields, categories, ['Cafe', 'Cafe'], ['ja', 'en'], [existingSpot, second], 'floor-a')
    const updated = result.parsedRows.find(row => row.spotId === 'spot-a')!
    expect(result.preview).toMatchObject({ updateCount: 1, unchangedCount: 1, errors: 0, conflicts: 0 })
    expect(updated.diffs.map(diff => diff.field)).toEqual(expect.arrayContaining(['紹介', '席数', 'name [en]', 'Categories 追加', 'Categories 削除']))
  })

  it('v2のblank IDをNEWとして既存UPDATEと混在でき、任意blankはclearになる', () => {
    const context = v2Context()
    const parsed = parseCsv(createSpotCsvExport(context)).rows
    const headers = parsed[0]!
    parsed[1]![headers.indexOf('field:custom:custom-number')] = ''
    parsed.push(headers.map(header => header === '__csvVersion' ? '2' : header === '__schemaVersion' ? context.schemaVersion : header === 'spot:name' ? 'New Cafe' : header === 'field:standard:description' ? '新規' : ''))
    const result = previewSpotCsv(encodeCsv(parsed), fields, categories, ['Cafe'], ['ja', 'en'], [existingSpot], 'floor-a')
    expect(result.preview).toMatchObject({ newCount: 1, updateCount: 1, errors: 0, conflicts: 0 })
    expect(result.parsedRows[0]?.customValues['custom-number']).toBeNull()
  })

  it('stale rowVersionとschema driftはCONFLICTになり、label-only schema変更は許容する', () => {
    const context = v2Context()
    const parsed = parseCsv(createSpotCsvExport(context)).rows
    parsed[1]![3] = 'stale'
    const stale = previewSpotCsv(encodeCsv(parsed), fields, categories, ['Cafe'], ['ja', 'en'], [existingSpot], 'floor-a')
    expect(stale.preview.conflicts).toBe(1)
    expect(stale.preview.rows[0]?.messages[0]?.message).toContain('最新CSVを再Exportしてください')

    const renamed = fields.map(field => ({ ...field, label: `${field.label} renamed` }))
    expect(computeSpotCsvSchemaVersion(renamed, ['ja', 'en'])).toBe(context.schemaVersion)
    const incompatible = fields.map(field => field.id === 'custom-number' ? { ...field, type: 'single_line_text' } : field)
    expect(computeSpotCsvSchemaVersion(incompatible, ['ja', 'en'])).not.toBe(context.schemaVersion)
  })

  it('duplicate/unknown/wrong-floor IDとpartial system metadataをERRORにする', () => {
    const context = v2Context()
    const parsed = parseCsv(createSpotCsvExport(context)).rows
    parsed.push([...parsed[1]!])
    expect(previewSpotCsv(encodeCsv(parsed), fields, categories, ['Cafe'], ['ja', 'en'], [existingSpot], 'floor-a').preview.errors).toBeGreaterThan(0)

    const unknown = parseCsv(createSpotCsvExport(context)).rows
    unknown[1]![2] = 'missing'
    expect(previewSpotCsv(encodeCsv(unknown), fields, categories, ['Cafe'], ['ja', 'en'], [existingSpot], 'floor-a').preview.rows[0]?.status).toBe('ERROR')

    const otherFloor = { ...existingSpot, floorId: 'floor-b' }
    const wrong = v2Context([otherFloor])
    wrong.floor.id = 'floor-b'
    expect(previewSpotCsv(createSpotCsvExport(wrong), fields, categories, ['Cafe'], ['ja', 'en'], [otherFloor], 'floor-a').preview.rows[0]?.status).toBe('ERROR')

    const partial = parseCsv(createSpotCsvExport(context)).rows
    partial[0] = partial[0]!.filter(header => header !== '__rowVersion')
    partial[1] = partial[1]!.filter((_cell, index) => index !== 3)
    expect(previewSpotCsv(encodeCsv(partial), fields, categories, ['Cafe'], ['ja', 'en'], [existingSpot], 'floor-a').preview.errors).toBeGreaterThan(0)
  })

  it('rowVersionは全CSV編集可能状態に反応し、除外状態には反応しない', () => {
    const initial = computeSpotCsvRowVersion(existingSpot, fields)
    expect(computeSpotCsvRowVersion({ ...existingSpot, description: 'changed' }, fields)).not.toBe(initial)
    expect(computeSpotCsvRowVersion({ ...existingSpot, spotCategories: [{ categoryId: 'cat-b' }] }, fields)).not.toBe(initial)
    expect(computeSpotCsvRowVersion({ ...existingSpot, fieldValues: [{ fieldDefinitionId: 'custom-number', valueJson: 99 }] }, fields)).not.toBe(initial)
    const excludedOnlyChange = { ...existingSpot, x: 0.5, isPublished: true }
    expect(computeSpotCsvRowVersion(excludedOnlyChange, fields)).toBe(initial)
  })

  it('100/1000行fixtureを線形にpreviewできる', () => {
    for (const size of [100, 1000]) {
      const rows = [['spot:name', 'field:standard:description', 'categories'], ...Array.from({ length: size }, (_, index) => [`Spot ${index}`, '紹介', index % 2 ? '観光' : '飲食'])]
      const started = performance.now()
      const result = previewSpotCsv(encodeCsv(rows), fields, categories, [])
      expect(result.preview).toMatchObject({ total: size, newCount: size, errors: 0 })
      expect(performance.now() - started).toBeLessThan(1500)
    }
  })

  it('import handlerは全行検証後に単一transactionで未配置・非公開Spotを作る', () => {
    const source = readFileSync(new URL('../server/api/maps/[mapId]/spots/import/index.post.ts', import.meta.url), 'utf8')
    expect(source).toContain('await prisma.$transaction')
    expect(source.indexOf('result.preview.errors > 0')).toBeLessThan(source.indexOf('transaction.spot.create'))
    expect(source).toContain('x: null')
    expect(source).toContain('y: null')
    expect(source).toContain('isPublished: false')
    expect(source).toContain("isolationLevel: 'Serializable'")
    expect(source).toContain('appendAuditEvent(transaction')
  })
})
