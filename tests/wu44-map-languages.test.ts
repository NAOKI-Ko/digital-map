import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mapLanguageLabel, mapLocales, orderedMapLocales, resolveFieldLabel } from '../shared/constants/map-languages'
import { mapLanguagesUpdateSchema } from '../shared/schemas/map-languages'
import { customSpotFieldCreateSchema, spotFieldUpdateSchema } from '../shared/schemas/spot-field'

const root = new URL('..', import.meta.url)
const source = (path: string) => readFileSync(new URL(path, root), 'utf8')

describe('WU-44 Map language model', () => {
  it('uses stable standard locale identities and human-readable labels', () => {
    expect(mapLocales).toEqual(['ja', 'en', 'zh-CN', 'zh-TW', 'ko', 'fr', 'de', 'es', 'it', 'pt-BR'])
    expect(mapLanguageLabel('ja')).toBe('日本語')
    expect(mapLanguageLabel('zh-CN')).toBe('简体中文')
  })

  it('keeps the default first and additional languages in stable order', () => {
    expect(orderedMapLocales('ja', ['ja', 'zh-CN', 'en', 'ko'])).toEqual(['ja', 'zh-CN', 'en', 'ko'])
    expect(orderedMapLocales('ja', ['en', 'ja', 'en'])).toEqual(['ja', 'en'])
  })

  it('rejects duplicate, unsupported, empty, and over-limit language lists', () => {
    expect(mapLanguagesUpdateSchema.safeParse({ enabledLocales: ['ja', 'en'] }).success).toBe(true)
    expect(mapLanguagesUpdateSchema.safeParse({ enabledLocales: ['ja', 'en', 'en'] }).success).toBe(false)
    expect(mapLanguagesUpdateSchema.safeParse({ enabledLocales: ['ja', 'xx-private'] }).success).toBe(false)
    expect(mapLanguagesUpdateSchema.safeParse({ enabledLocales: [] }).success).toBe(false)
  })

  it('blocks default removal and requires it to remain first at the authoritative API', () => {
    const patchApi = source('server/api/maps/[mapId]/languages/index.patch.ts')
    expect(patchApi).toContain("result.data.enabledLocales.includes(config.defaultLocale)")
    expect(patchApi).toContain('既定言語は削除できません。')
    expect(patchApi).toContain('result.data.enabledLocales[0] !== config.defaultLocale')
  })

  it('uses the existing Map/Tenant access guard for reads and writes', () => {
    const getApi = source('server/api/maps/[mapId]/languages/index.get.ts')
    const patchApi = source('server/api/maps/[mapId]/languages/index.patch.ts')
    expect(getApi).toContain('requireMapAccess(event)')
    expect(patchApi).toContain('requireMapAccess(event)')
    expect(source('server/utils/map-access.ts')).toContain('map.tenantId !== session.user.tenantId')
  })
})

describe('WU-44 FieldDefinition label translations', () => {
  const base = { label: '紹介文', enabled: true, publicVisible: true, required: false, order: 1, type: 'multiline_text' }

  it('requires the default label while allowing optional blank translations', () => {
    expect(customSpotFieldCreateSchema.safeParse({ ...base, label: '', translations: {} }).success).toBe(false)
    expect(customSpotFieldCreateSchema.safeParse({ ...base, translations: { en: '', 'zh-CN': null } }).success).toBe(true)
    expect(spotFieldUpdateSchema.safeParse({ translations: { en: '', ko: '소개' } }).success).toBe(true)
  })

  it('falls back at read time without storing a fake translation', () => {
    const rows = [{ locale: 'en', label: 'Description' }, { locale: 'zh-CN', label: '' }]
    expect(resolveFieldLabel('紹介文', rows, 'en', 'ja')).toBe('Description')
    expect(resolveFieldLabel('紹介文', rows, 'zh-CN', 'ja')).toBe('紹介文')
    expect(resolveFieldLabel('紹介文', rows, 'ko', 'ja')).toBe('紹介文')
  })

  it('updates translations coherently and deletes only explicitly blank locale rows', () => {
    const updateApi = source('server/api/maps/[mapId]/spot-fields/[fieldId].patch.ts')
    expect(updateApi).toContain('for (const [locale, label] of Object.entries(translations ?? {}))')
    expect(updateApi).toContain('spotFieldDefinitionTranslation.deleteMany')
    expect(updateApi).toContain('spotFieldDefinitionTranslation.upsert')
    expect(updateApi).toContain('fieldDefinitionId_locale')
  })

  it('creates a custom field and translations in one operation', () => {
    const createApi = source('server/api/maps/[mapId]/spot-fields/index.post.ts')
    expect(createApi).toContain('translations: {')
    expect(createApi).toContain('create: Object.entries(translations)')
    expect(createApi).toContain("Boolean(entry[1]?.trim())")
  })

  it('retains historical translations when a language membership is removed', () => {
    const languageApi = source('server/api/maps/[mapId]/languages/index.patch.ts')
    expect(languageApi).not.toContain('spotFieldDefinitionTranslation.delete')
    expect(languageApi).not.toContain('mapTranslation.delete')
  })

  it('renders enabled locales dynamically in vertical edit and add-field groups', () => {
    const page = source('app/pages/admin/maps/[mapId]/fields.vue')
    expect(page).toContain('enabledLocales.filter(item => item !== defaultLocale)')
    expect(page).toContain('mapLanguageLabel(defaultLocale)')
    expect(page).toContain('md:col-span-2')
    expect(page).toContain('max-h-72')
    expect(page).not.toContain('英語名（任意）')
    expect(page).toContain('translations: translationPayload(current)')
  })

  it('reuses WU-43 Reka Select/Dialog for language management', () => {
    const page = source('app/pages/admin/maps/[mapId]/settings.vue')
    expect(page).toContain("import UiDialog from '~/components/ui/UiDialog.vue'")
    expect(page).toContain("import UiSelect from '~/components/ui/UiSelect.vue'")
    expect(page).toContain(':options="availableLanguageOptions"')
    expect(page).toContain('locale !== defaultLocale')
  })

  it('reuses the existing compatible schema without destructive migration', () => {
    const migration = source('prisma/migrations/20260914060000_ja_en_translations/migration.sql')
    expect(migration).toContain('ADD COLUMN "defaultLocale"')
    expect(migration).toContain('ADD COLUMN "enabledLocales"')
    expect(migration).toContain('CREATE TABLE "SpotFieldDefinitionTranslation"')
    expect(migration).toContain('"fieldDefinitionId", "locale"')
  })
})
