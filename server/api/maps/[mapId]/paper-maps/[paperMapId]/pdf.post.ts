import { paperMapPdfSchema, parsePaperMapConfig } from '~~/shared/schemas/paper-map'
import { canUsePaperDesign } from '~~/shared/utils/paper-map-designs'
import { generatePaperMapPdf } from '~~/server/utils/paper-map-pdf'
import { loadPaperMapSource, paperMapWarnings, selectPaperMapSpots } from '~~/server/utils/paper-map'
import { paperMapPreviewToken } from '~~/server/utils/paper-map-preview-token'
import { getPublicStorage } from '~~/server/utils/public-storage'

export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const paperMapId = getRouterParam(event, 'paperMapId')
  const saved = await prisma.paperMap.findFirst({ where: { id: paperMapId, mapId: map.id }, select: { config: true } })
  if (!saved) throw createError({ statusCode: 404, statusMessage: '紙マップが見つかりません。' })
  const parsed = paperMapPdfSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: parsed.error.issues[0]?.message ?? 'PDF設定を確認してください。' })
  if (!canUsePaperDesign(parsed.data.config, parsePaperMapConfig(saved.config))) throw createError({ statusCode: 422, statusMessage: 'このデザインは新たに選択できません。' })
  const source = await loadPaperMapSource(map.id, parsed.data.config.sourceMode, event)
  if (parsed.data.config.templateVersion >= 2 && parsed.data.previewToken !== paperMapPreviewToken(source, parsed.data.config)) throw createError({ statusCode: 409, statusMessage: '紙面の内容が更新されています。「紙面を更新」で確認してからPDFを出力してください。' })
  const warnings = paperMapWarnings(source, parsed.data.config)
  if (!selectPaperMapSpots(source, parsed.data.config).length) throw createError({ statusCode: 422, statusMessage: warnings[0] ?? 'PDFに出力できるスポットがありません。' })
  const bytes = await generatePaperMapPdf(source, parsed.data.config, { publicBaseUrl: String(useRuntimeConfig(event).publicBaseUrl), uploadDirectory: getUploadDirectory(event), storage: getPublicStorage() })
  setResponseHeaders(event, { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="paper-map-${paperMapId}-${parsed.data.config.paper}.pdf"`, 'Cache-Control': 'private, no-store', 'X-Paper-Map-Warnings': encodeURIComponent(warnings.join(' | ')) })
  return bytes
})
