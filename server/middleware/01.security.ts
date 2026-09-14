export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Content-Security-Policy': contentSecurityPolicy,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'X-Frame-Options': 'DENY',
  })
  const url = getRequestURL(event)
  if (process.env.NODE_ENV === 'production') {
    const host = effectiveRequestHost(event)
    if (!configuredTrustedHosts(event).has(host)) throw createError({ statusCode: 421, statusMessage: '信頼されていないHostです。' })
    if (effectiveRequestProtocol(event) !== 'https:') {
      return sendRedirect(event, `https://${host}${url.pathname}${url.search}`, 308)
    }
    setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  await enforceCsrfOrigin(event)
})
