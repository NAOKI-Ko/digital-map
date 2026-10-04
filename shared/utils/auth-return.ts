export function authReturnPath(value: unknown) {
  if (typeof value !== 'string' || /[\\\u0000-\u0020]/.test(value)) return '/admin/dashboard'
  try {
    const base = 'https://local.invalid'
    const target = new URL(value, base)
    if (target.origin !== base || !value.startsWith('/')) return '/admin/dashboard'
    const path = decodeURIComponent(target.pathname)
    if (path.includes('\\') || path.includes('//')) return '/admin/dashboard'
    if (path.startsWith('/admin/') && path !== '/admin/login' && path !== '/admin/login/') return value
    if (path === '/invite/accept' && target.searchParams.get('token')) return value
  }
  catch { /* Invalid return targets use the normal dashboard. */ }
  return '/admin/dashboard'
}
