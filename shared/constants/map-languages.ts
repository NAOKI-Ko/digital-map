export const mapLocales = ['ja', 'en', 'zh-CN', 'zh-TW', 'ko', 'fr', 'de', 'es', 'it', 'pt-BR'] as const

export type MapLocale = typeof mapLocales[number]

export const defaultMapLocale: MapLocale = 'ja'

export const mapLanguageOptions: ReadonlyArray<{ value: MapLocale, label: string }> = [
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
]

export function isMapLocale(value: unknown): value is MapLocale {
  return typeof value === 'string' && mapLocales.includes(value as MapLocale)
}

export function orderedMapLocales(defaultLocale: MapLocale, enabledLocales: readonly string[]) {
  const enabled = enabledLocales.filter(isMapLocale)
  return [defaultLocale, ...enabled.filter(locale => locale !== defaultLocale)]
    .filter((locale, index, values) => values.indexOf(locale) === index)
}

export function mapLanguageLabel(locale: MapLocale) {
  return mapLanguageOptions.find(option => option.value === locale)?.label ?? locale
}

export function resolveFieldLabel(
  defaultLabel: string,
  translations: ReadonlyArray<{ locale: string, label: string | null }>,
  locale: string,
  defaultLocale: string = defaultMapLocale,
) {
  if (locale === defaultLocale) return defaultLabel
  const translated = translations.find(item => item.locale === locale)?.label
  return typeof translated === 'string' && translated.trim() ? translated : defaultLabel
}
