const protectedApiPrefixes = ['/api/maps', '/api/uploads', '/api/geocode']

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  const requiresAuthentication = protectedApiPrefixes.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`),
  )

  if (requiresAuthentication) {
    await requireAdminSession(event)
  }
})
