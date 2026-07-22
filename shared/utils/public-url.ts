export function buildPublicMapUrl(origin: string, slug: string) {
  return new URL(`/${encodeURIComponent(slug)}`, origin).toString()
}
