import { unpublishCurrentMap } from '~~/server/utils/public-release'
export default defineEventHandler(async event => {
  const access = await requireMapAccess(event)
  await requireTenantOwner(event, access.map.tenantId)
  // Retain schema IDs, canonical content and immutable releases. Public pointer is closed first.
  await unpublishCurrentMap(access.map.id, access.map.tenantId, access.session.user.id, undefined, true)
  return { deletedId: access.map.id, archived: true }
})
