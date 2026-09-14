export default defineEventHandler(async (event) => {
  let database = false
  try { await prisma.$queryRaw`SELECT 1`; database = true }
  catch { database = false }
  const config = useRuntimeConfig(event)
  const fakeMail = config.deploymentEnvironment !== 'production' && process.env.MAIL_PROVIDER === 'fake'
  const mailConfigured = fakeMail || (Boolean(config.resendApiKey) && Boolean(config.mailFrom))
  const ready = database && mailConfigured
  if (!ready) setResponseStatus(event, 503)
  return { status: ready ? 'ready' : 'not_ready', dependencies: { database, mail: fakeMail ? 'fake' : mailConfigured ? 'configured' : 'not_configured' } }
})
