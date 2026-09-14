export default defineEventHandler((event) => {
  const requestId = resolveRequestId(getHeader(event, 'x-request-id'))
  event.context.requestId = requestId
  setHeader(event, 'X-Request-Id', requestId)
})
