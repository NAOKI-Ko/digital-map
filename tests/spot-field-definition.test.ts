import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { customSpotFieldTypes, defaultSpotFieldDefinitions } from '../shared/constants/spot-fields'
import { customSpotFieldCreateSchema, spotFieldUpdateSchema, validateCustomFieldValue } from '../shared/schemas/spot-field'

const updateSource = readFileSync(new URL('../server/api/maps/[mapId]/spot-fields/[fieldId].patch.ts', import.meta.url), 'utf8')
const deleteSource = readFileSync(new URL('../server/api/maps/[mapId]/spot-fields/[fieldId].delete.ts', import.meta.url), 'utf8')
const migration = readFileSync(new URL('../prisma/migrations/20260913030000_spot_field_definitions/migration.sql', import.meta.url), 'utf8')

describe('Spot Field Definition', () => {
  it('新規Mapの標準既定値を固定する', () => {
    expect(defaultSpotFieldDefinitions.filter(field => field.enabled).map(field => field.semanticKey))
      .toEqual(['description', 'address', 'hours', 'holiday', 'website'])
    expect(defaultSpotFieldDefinitions.find(field => field.semanticKey === 'phone')).toMatchObject({ enabled: false, publicVisible: false })
  })

  it('Phase 1 custom typeを5種類だけに制限する', () => {
    expect(customSpotFieldTypes).toEqual(['single_line_text', 'multiline_text', 'number', 'url', 'boolean'])
    const base = { label: '項目', enabled: true, publicVisible: true, required: false, order: 1 }
    expect(customSpotFieldCreateSchema.safeParse({ ...base, type: 'date' }).success).toBe(false)
    expect(customSpotFieldCreateSchema.safeParse({ ...base, type: 'select' }).success).toBe(false)
  })

  it('disabledかつpublicVisibleを拒否する', () => {
    expect(spotFieldUpdateSchema.safeParse({ enabled: false, publicVisible: true }).success).toBe(false)
  })

  it('custom value typeを検証する', () => {
    expect(validateCustomFieldValue('number', 12)).toBe(true)
    expect(validateCustomFieldValue('number', '12')).toBe(false)
    expect(validateCustomFieldValue('boolean', false)).toBe(true)
    expect(validateCustomFieldValue('url', 'javascript:alert(1)')).toBe(false)
  })

  it('値ありcustom fieldのtype変更と物理削除を拒否する', () => {
    expect(updateSource).toContain("owned._count.values > 0")
    expect(updateSource).toContain('種類を変更できません')
    expect(deleteSource).toContain('field._count.values > 0')
    expect(deleteSource).toContain('無効にしてください')
  })

  it('既存Mapへ標準定義をbackfillし、値列を専用tableに置く', () => {
    expect(migration).toContain('INSERT INTO "SpotFieldDefinition"')
    expect(migration).toContain('CREATE TABLE "SpotFieldValue"')
    expect(migration).toContain('SpotFieldDefinition_visibility_check')
  })
})
