export default defineEventHandler(async (event) => {
  const spotId = getRouterParam(event, 'spotId')
  if (!spotId) throw createError({ statusCode: 400, statusMessage: 'スポットIDが必要です。' })
  const revision = await saveSpotRevision(event, spotId, await readBody(event))
  return { revision, statusLabel: '承認待ち' }
})
