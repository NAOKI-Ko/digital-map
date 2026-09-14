export default defineEventHandler(async (event) => {
  let database = false
  try { await prisma.$queryRaw`SELECT 1`; database = true }
  catch { database = false }
  const config = useRuntimeConfig(event)
  const mailConfigured = process.env.NODE_ENV !== 'production' || (Boolean(config.resendApiKey) && Boolean(config.mailFrom))
  const ready = database && mailConfigured
  if (!ready) setResponseStatus(event, 503)
  return { status: ready ? 'ready' : 'not_ready', dependencies: { database, mail: mailConfigured ? 'configured' : 'not_configured' } }
})
