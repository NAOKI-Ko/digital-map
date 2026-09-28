import { publicAbsoluteUrl } from './origin'

export function buildPublicMapUrl(origin: string, slug: string) {
  return publicAbsoluteUrl(origin, `/${encodeURIComponent(slug)}`)
}
