export function canonicalOrigin(value: unknown, name: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required`)
  let url: URL
  try { url = new URL(value) }
  catch { throw new Error(`${name} must be an absolute HTTP(S) origin`) }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${name} must be an HTTP(S) origin without credentials, path, query, or fragment`)
  }
  return url.origin
}

export function adminAbsoluteUrl(adminOrigin: string, path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Admin URL path must be root-relative')
  return new URL(path, `${canonicalOrigin(adminOrigin, 'ADMIN_ORIGIN')}/`).toString()
}

export function publicAbsoluteUrl(publicOrigin: string, path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Public URL path must be root-relative')
  return new URL(path, `${canonicalOrigin(publicOrigin, 'PUBLIC_ORIGIN')}/`).toString()
}

export function assertDeploymentOrigins(
  environment: string,
  effective: { adminOrigin: string, publicOrigin: string },
  declared: { adminOrigin?: string, publicOrigin?: string },
) {
  if (environment === 'development' || environment === 'test') return
  for (const [name, actual, expected] of [
    ['ADMIN_BASE_URL', effective.adminOrigin, declared.adminOrigin],
    ['PUBLIC_BASE_URL', effective.publicOrigin, declared.publicOrigin],
  ] as const) {
    if (!expected) throw new Error(`${name} is required for ${environment}`)
    if (canonicalOrigin(expected, name) !== canonicalOrigin(actual, name)) {
      throw new Error(`${name} differs from effective Nuxt runtime origin; set the matching NUXT_ runtime override before starting`)
    }
  }
}
