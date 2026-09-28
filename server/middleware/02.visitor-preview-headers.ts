export default defineEventHandler((event) => {
  if (!/^\/admin\/maps\/[^/]+\/preview\/?$/.test(event.path.split('?')[0] ?? '')) return
  setResponseHeaders(event, {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    Vary: 'Cookie',
  })
})
