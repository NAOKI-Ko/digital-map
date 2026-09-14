export const supportedLocales = ['ja', 'en'] as const
export type AppLocale = typeof supportedLocales[number]
export const defaultLocale: AppLocale = 'ja'

export const messages = {
  ja: { map: 'マップ', spots: 'スポット', categories: 'カテゴリー', filter: '絞り込み', close: '閉じる', official: '公式', loading: 'マップを読み込んでいます…', error: '公開マップを表示できません', language: '言語', save: '保存', edit: '編集', delete: '削除', publish: '公開', pending: '承認待ち' },
  en: { map: 'Map', spots: 'Spots', categories: 'Categories', filter: 'Filter', close: 'Close', official: 'Official', loading: 'Loading map…', error: 'Unable to display this public map', language: 'Language', save: 'Save', edit: 'Edit', delete: 'Delete', publish: 'Publish', pending: 'Pending review' },
} as const

export function normalizeLocale(input: unknown, enabled: readonly string[] = supportedLocales): AppLocale {
  return input === 'en' && enabled.includes('en') ? 'en' : 'ja'
}

export function translatedValue<T extends Record<string, unknown>>(base: string | null, translations: T[], locale: AppLocale, key: keyof T) {
  if (locale === 'ja') return base
  const value = translations.find(item => item.locale === locale)?.[key]
  return typeof value === 'string' && value.trim() ? value : base
}
