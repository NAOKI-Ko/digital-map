import { analyticsBuffer } from '~~/server/utils/analytics'

export default defineNitroPlugin((nitroApp) => {
  const timer = setInterval(() => void analyticsBuffer.flush().catch(() => undefined), 30_000)
  timer.unref?.()
  nitroApp.hooks.hook('close', async () => {
    clearInterval(timer)
    await analyticsBuffer.flush()
  })
})
