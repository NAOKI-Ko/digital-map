import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createSpotCsvTemplate, previewSpotCsv } from '../server/utils/spot-csv'

const fields = [
  { id: 'description-id', kind: 'standard', semanticKey: 'description', label: '紹介', type: 'multiline_text', enabled: true, required: true, order: 0 },
  { id: 'custom-number', kind: 'custom', semanticKey: null, label: '席数', type: 'number', enabled: true, required: false, order: 1 },
  { id: 'disabled', kind: 'custom', semanticKey: null, label: '非表示', type: 'single_line_text', enabled: false, required: false, order: 2 },
]
const categories = [{ id: 'cat-a', name: '観光' }, { id: 'cat-b', name: '飲食' }]

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

  it('import handlerは全行検証後に単一transactionで未配置・非公開Spotを作る', () => {
    const source = readFileSync(new URL('../server/api/maps/[mapId]/spots/import/index.post.ts', import.meta.url), 'utf8')
    expect(source).toContain('await prisma.$transaction')
    expect(source.indexOf('result.preview.errors > 0')).toBeLessThan(source.indexOf('transaction.spot.create'))
    expect(source).toContain('x: null')
    expect(source).toContain('y: null')
    expect(source).toContain('isPublished: false')
  })
})
