import { addMapEditorSchema } from '~~/shared/schemas/organization'

export default defineEventHandler(async (event) => {
  const access = await requireMapAccess(event)
  await requireTenantOwner(event, access.map.tenantId)
  const input = await readValidatedBody(event, addMapEditorSchema.parse)
  const assignment = await assignMapEditor(access.map.id, access.map.tenantId, input.userId, access.session.user.id)
  return { assignment }
})
