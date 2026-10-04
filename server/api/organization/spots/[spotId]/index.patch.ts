import { requireWorkspaceSpot, workspaceContentInput, updateWorkspaceContent } from '~~/server/utils/workspace-spot'
export default defineEventHandler(async event => {
  const context = await requireWorkspaceSpot(event)
  const input = await readValidatedBody(event, workspaceContentInput.parse)
  try { return { spot: await prisma.$transaction(tx => updateWorkspaceContent(tx, context, input), { isolationLevel: 'Serializable' }) } }
  catch (error) {
    if (typeof error === 'object' && error && 'code' in error && ['P2025', 'P2034'].includes(String(error.code))) throw createError({ statusCode: 409, statusMessage: 'スポットが更新されています。再読込してください。' })
    throw error
  }
})
