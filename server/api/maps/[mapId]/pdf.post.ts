import { mapPdfRequestSchema } from '~~/shared/schemas/map-pdf'
import { generateMapPdf } from '~~/server/utils/map-pdf'
import { getLivePublicMapById } from '~~/server/utils/public-map'
import { loadCurrentPublicSnapshot } from '~~/server/utils/public-release'
import { getPublicStorage } from '~~/server/utils/public-storage'

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const input = await readValidatedBody(event, mapPdfRequestSchema.parse)
  const record = await prisma.map.findUnique({ where: { id: map.id }, select: { slug: true, isPublished: true, currentReleaseId: true } })
  if (!record) throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  const storage = getPublicStorage()
  const published = Boolean(record.isPublished && record.currentReleaseId)
  const source = published ? await loadCurrentPublicSnapshot(record.slug, 'ja', storage) : await getLivePublicMapById(map.id, 'ja')
  if (!source) throw createError({ statusCode: 409, statusMessage: 'PDFに出力できるマップ内容がありません。' })
  const bytes = await generateMapPdf(source, input, { preview: !published, publicBaseUrl: String(useRuntimeConfig(event).publicBaseUrl), uploadDirectory: getUploadDirectory(event), storage })
  setResponseHeaders(event, { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${record.slug}-${input.paper}-${input.orientation}.pdf"`, 'Cache-Control': 'private, no-store' })
  return bytes
})
