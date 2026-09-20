import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCsv, encodeCsv } from '../lib/csv'
import { computeSpotCsvSchemaVersion, createSpotCsvExport, previewSpotCsv } from '../server/utils/spot-csv'

const fields = [
  { id: 'description', kind: 'standard', semanticKey: 'description', label: '紹介', type: 'multiline_text', enabled: true, required: false, order: 0 },
  { id: 'parking-a', kind: 'custom', semanticKey: null, label: '駐車場', type: 'single_line_text', enabled: true, required: false, order: 1 },
  { id: 'parking-b', kind: 'custom', semanticKey: null, label: '駐車場', type: 'single_line_text', enabled: true, required: false, order: 2 },
]
const floors = [{ id: 'floor-a', name: '1階', order: 0 }, { id: 'floor-b', name: '2階', order: 1 }]
const categories = [{ id: 'cat-a', name: '観光' }]
const spot = {
  id: 'spot-a', floorId: 'floor-a', name: '案内所', description: '案内', address: null, website: null, hoursText: null, holidayText: null, phone: null,
  spotCategories: [{ categoryId: 'cat-a' }], fieldValues: [{ fieldDefinitionId: 'parking-a', valueJson: 'あり' }], translations: [], fieldValueTranslations: [],
}

function context() {
  return {
    floors, fields, categories, existingNames: [spot.name], enabledLocales: ['ja', 'en'], spots: [spot],
    schemaVersion: computeSpotCsvSchemaVersion(fields, ['ja', 'en'], floors),
  }
}

describe('WU-52 product contracts', () => {
  it('exports map-wide CSV v3 with human columns first and machine columns last', () => {
    const rows = parseCsv(createSpotCsvExport(context())).rows
    expect(rows[0]).toEqual([
      'フロア', 'スポット名', '説明', '駐車場', '駐車場（2）', 'カテゴリー', 'スポット名（英語）', '説明（英語）', '駐車場（英語）', '駐車場（2）（英語）',
      '__csvVersion', '__schemaVersion', '__spotId', '__rowVersion', '__floorId',
    ])
    expect(rows[1]?.[0]).toBe('1階')
    expect(rows[1]?.at(-1)).toBe('floor-a')
  })

  it('resolves a new v3 row by exact floor name and blocks existing floor moves', () => {
    const exported = parseCsv(createSpotCsvExport(context())).rows
    const headers = exported[0]!
    exported.push(headers.map(header => header === 'フロア' ? '2階' : header === 'スポット名' ? '新規' : header === '__csvVersion' ? '3' : header === '__schemaVersion' ? context().schemaVersion : ''))
    const created = previewSpotCsv(encodeCsv(exported), fields, categories, [spot.name], ['ja', 'en'], [spot], undefined, floors)
    expect(created.preview).toMatchObject({ newCount: 1, unchangedCount: 1, errors: 0 })
    expect(created.parsedRows[1]?.floorId).toBe('floor-b')

    exported[1]![headers.indexOf('フロア')] = '2階'
    exported[1]![headers.indexOf('__floorId')] = 'floor-b'
    const moved = previewSpotCsv(encodeCsv(exported.slice(0, 2)), fields, categories, [spot.name], ['ja', 'en'], [spot], undefined, floors)
    expect(moved.preview.rows[0]?.messages.some(message => message.message.includes('フロア変更はCSVではできません'))).toBe(true)
  })

  it('uses local decoration drafts and only commits from gesture end', () => {
    const source = readFileSync(new URL('../app/pages/admin/maps/[mapId]/floors/[floorId]/decorations.vue', import.meta.url), 'utf8')
    expect(source).toContain('type DecorationDraft')
    expect(source).toContain('requestAnimationFrame(render)')
    expect(source).toContain("window.addEventListener('pointerup', end)")
    expect(source).toContain('void commit(next, start)')
    expect(source).not.toContain('type="range"')
    expect(source).not.toContain('インスタンス削除')
  })

  it('mounts one toast host and removes raw revision JSON from the UI', () => {
    const app = readFileSync(new URL('../app/app.vue', import.meta.url), 'utf8')
    const revision = readFileSync(new URL('../app/pages/admin/maps/[mapId]/revisions.vue', import.meta.url), 'utf8')
    expect(app.match(/<UiToastHost/g)).toHaveLength(1)
    expect(revision).not.toContain('JSON.stringify')
    expect(revision).toContain('変更後')
    expect(revision).toContain('変更申請を却下')
  })

  it('leaves no native single select in Admin UI', () => {
    const files = [
      '../app/pages/admin/maps/[mapId]/spots/index.vue', '../app/pages/admin/maps/[mapId]/editors.vue', '../app/pages/admin/maps/[mapId]/spots/[spotId]/assignee.vue',
      '../app/components/admin/SpotForm.vue', '../app/components/admin/MediaPicker.vue', '../app/components/admin/PaperExportPanel.vue',
    ]
    for (const file of files) expect(readFileSync(new URL(file, import.meta.url), 'utf8')).not.toContain('<select')
  })
})
