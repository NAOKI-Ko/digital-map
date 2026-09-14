import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { normalizeLocale, translatedValue } from '../shared/i18n/messages'

describe('ja/en i18n contract', () => {
  it('日本語を既定にし、未対応・未有効localeを日本語へ戻す', () => {
    expect(normalizeLocale(undefined, ['ja', 'en'])).toBe('ja')
    expect(normalizeLocale('en', ['ja', 'en'])).toBe('en')
    expect(normalizeLocale('en', ['ja'])).toBe('ja')
    expect(normalizeLocale('fr', ['ja', 'en'])).toBe('ja')
  })

  it('英語訳がない・空なら既存日本語を壊さない', () => {
    expect(translatedValue('日本語', [], 'en', 'name')).toBe('日本語')
    expect(translatedValue('日本語', [{ locale: 'en', name: '' }], 'en', 'name')).toBe('日本語')
    expect(translatedValue('日本語', [{ locale: 'en', name: 'English' }], 'en', 'name')).toBe('English')
  })

  it('公開APIはlangを受け渡し、管理翻訳APIはMap境界を検証する', () => {
    const publicApi = readFileSync(new URL('../server/api/public/[mapSlug]/index.get.ts', import.meta.url), 'utf8')
    const spotApi = readFileSync(new URL('../server/api/maps/[mapId]/spots/[spotId]/translations/index.patch.ts', import.meta.url), 'utf8')
    expect(publicApi).toContain('getQuery(event).lang')
    expect(spotApi).toContain('requireOwnedSpot(event)')
    expect(spotApi).toContain("type: { in: ['single_line_text', 'multiline_text'] }")
    expect(spotApi).toContain('liveVersion: { increment: 1 }')
  })

  it('公開UIに明示的な言語切替と英語有効時のbrowser suggestionがある', () => {
    const page = readFileSync(new URL('../app/pages/[mapSlug]/index.vue', import.meta.url), 'utf8')
    expect(page).toContain('public-locale')
    expect(page).toContain('route.query.lang')
    expect(page).toContain("navigator.language.toLowerCase().startsWith('en')")
  })
})
