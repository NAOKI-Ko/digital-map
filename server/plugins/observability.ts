export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error, context) => {
    const event = context.event
    const code = typeof (error as any)?.statusCode === 'number' ? `http_${(error as any).statusCode}` : 'unhandled_error'
    const message = error instanceof Error ? error.message : 'Unhandled server error'
    operationalLog('error', { event, route: event ? getRequestURL(event).pathname : undefined, action: 'unhandled_error', code, message })
    if (!code.startsWith('http_4')) await notifyOperations({ code, message, requestId: event ? requestIdFor(event) : undefined, route: event ? getRequestURL(event).pathname : undefined })
  })
})
