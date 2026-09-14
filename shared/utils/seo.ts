export function buildPublicLocaleUrl(baseUrl: string, slug: string, locale: 'ja' | 'en') {
  return `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(slug)}${locale === 'en' ? '?lang=en' : ''}`
}

export function buildLocaleLinks(baseUrl: string, slug: string, currentLocale: 'ja' | 'en', enabledLocales: Array<'ja' | 'en'>) {
  return [
    { rel: 'canonical' as const, href: buildPublicLocaleUrl(baseUrl, slug, currentLocale) },
    ...enabledLocales.map(locale => ({ rel: 'alternate' as const, hreflang: locale, href: buildPublicLocaleUrl(baseUrl, slug, locale) })),
    { rel: 'alternate' as const, hreflang: 'x-default', href: buildPublicLocaleUrl(baseUrl, slug, 'ja') },
  ]
}
