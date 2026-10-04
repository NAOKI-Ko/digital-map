import { requireWorkspaceSpot } from '~~/server/utils/workspace-spot'
export default defineEventHandler(async event => {
  const { spot } = await requireWorkspaceSpot(event)
  const [fields, values, assignment, revisions] = await Promise.all([
    spot.schemaMapId ? prisma.spotFieldDefinition.findMany({ where: { mapId: spot.schemaMapId }, orderBy: { order: 'asc' } }) : [],
    prisma.spotFieldValue.findMany({ where: { spotId: spot.id } }),
    prisma.spotEditorAssignment.findUnique({ where: { spotId: spot.id }, select: { userId: true } }),
    prisma.spotRevision.findMany({ where: { spotId: spot.id, status: 'PENDING' }, select: { id: true, baseVersion: true, payload: true }, orderBy: { createdAt: 'asc' } }),
  ])
  return { spot: { id: spot.id, name: spot.name, description: spot.description, address: spot.address, website: spot.website, phone: spot.phone, hoursText: spot.hoursText, holidayText: spot.holidayText, contentVersion: spot.contentVersion }, fields, customValues: Object.fromEntries(values.map(v => [v.fieldDefinitionId, v.valueJson])), assignment, revisions }
})
