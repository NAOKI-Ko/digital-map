export default defineEventHandler(async (event) => {
  const base = String(useRuntimeConfig().publicBaseUrl).replace(/\/$/, '')
  const maps = await prisma.map.findMany({ where: { isPublished: true, currentReleaseId: { not: null } }, select: { slug: true, enabledLocales: true }, orderBy: { slug: 'asc' } })
  const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
  const urls = maps.flatMap(map => map.enabledLocales.filter(locale => locale === 'ja' || locale === 'en').map((locale) => {
    const location = `${base}/${encodeURIComponent(map.slug)}${locale === 'en' ? '?lang=en' : ''}`
    const alternates = map.enabledLocales.filter(value => value === 'ja' || value === 'en').map(value => `<xhtml:link rel="alternate" hreflang="${value}" href="${escape(`${base}/${encodeURIComponent(map.slug)}${value === 'en' ? '?lang=en' : ''}`)}"/>`).join('')
    return `<url><loc>${escape(location)}</loc>${alternates}<xhtml:link rel="alternate" hreflang="x-default" href="${escape(`${base}/${encodeURIComponent(map.slug)}`)}"/></url>`
  }))
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`
})
