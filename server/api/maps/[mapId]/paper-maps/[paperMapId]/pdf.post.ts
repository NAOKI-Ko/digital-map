import { paperMapPdfSchema } from '~~/shared/schemas/paper-map'
import { generatePaperMapPdf } from '~~/server/utils/paper-map-pdf'
import { loadPaperMapSource, paperMapWarnings, selectPaperMapSpots } from '~~/server/utils/paper-map'
import { paperMapPreviewToken } from '~~/server/utils/paper-map-preview-token'
import { getPublicStorage } from '~~/server/utils/public-storage'

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const paperMapId = getRouterParam(event, 'paperMapId')
  const exists = await prisma.paperMap.count({ where: { id: paperMapId, mapId: map.id } })
  if (!exists) throw createError({ statusCode: 404, statusMessage: '紙マップが見つかりません。' })
  const parsed = paperMapPdfSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: parsed.error.issues[0]?.message ?? 'PDF設定を確認してください。' })
  const source = await loadPaperMapSource(map.id, parsed.data.config.sourceMode, event)
  if (parsed.data.config.templateVersion >= 2 && parsed.data.previewToken !== paperMapPreviewToken(source, parsed.data.config)) throw createError({ statusCode: 409, statusMessage: '紙面の内容が更新されています。「紙面を更新」で確認してからPDFを出力してください。' })
  const warnings = paperMapWarnings(source, parsed.data.config)
  if (!selectPaperMapSpots(source, parsed.data.config).length) throw createError({ statusCode: 422, statusMessage: warnings[0] ?? 'PDFに出力できるスポットがありません。' })
  const bytes = await generatePaperMapPdf(source, parsed.data.config, { publicBaseUrl: String(useRuntimeConfig(event).publicBaseUrl), uploadDirectory: getUploadDirectory(event), storage: getPublicStorage() })
  setResponseHeaders(event, { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="paper-map-${paperMapId}-${parsed.data.config.paper}.pdf"`, 'Cache-Control': 'private, no-store', 'X-Paper-Map-Warnings': encodeURIComponent(warnings.join(' | ')) })
  return bytes
})
