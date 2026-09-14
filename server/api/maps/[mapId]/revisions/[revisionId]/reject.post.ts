import { rejectSpotRevisionSchema } from '~~/shared/schemas/spot-revision'

export default defineEventHandler(async (event) => {
  await requireMapAccess(event)
  const revisionId = getRouterParam(event, 'revisionId')
  if (!revisionId) throw createError({ statusCode: 400, statusMessage: 'Revision IDが必要です。' })
  const input = await readValidatedBody(event, rejectSpotRevisionSchema.parse)
  return rejectSpotRevision(event, revisionId, input.reason)
})
