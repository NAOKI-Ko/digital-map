import { z } from 'zod'
import { paperMapConfigV2Schema, parsePaperMapConfig } from '~~/shared/schemas/paper-map'
import { canUsePaperDesign } from '~~/shared/utils/paper-map-designs'
import { loadPaperMapSource } from '~~/server/utils/paper-map'
import { createEditorialRenderer } from '~~/server/utils/paper-map-editorial-renderer'
import { createPaperPageRenderer } from '~~/server/utils/paper-map-document-renderer'
import { paperMapPreviewToken } from '~~/server/utils/paper-map-preview-token'
import { getPublicStorage } from '~~/server/utils/public-storage'

const schema = z.object({ config: paperMapConfigV2Schema, paperMapId: z.string().min(1).optional(), thumbnail: z.boolean().default(false), page: z.number().int().min(0).max(63).default(0) })
export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success || parsed.data.config.templateVersion < 2) throw createError({ statusCode: 422, statusMessage: '紙面の設定を確認してください。' })
  if (!canUsePaperDesign(parsed.data.config)) {
    const saved = parsed.data.paperMapId ? await prisma.paperMap.findFirst({ where: { id: parsed.data.paperMapId, mapId: map.id }, select: { config: true } }) : null
    if (!saved || !canUsePaperDesign(parsed.data.config, parsePaperMapConfig(saved.config))) throw createError({ statusCode: 422, statusMessage: 'このデザインは新たに選択できません。' })
  }
  const source = await loadPaperMapSource(map.id, parsed.data.config.sourceMode, event)
  const renderer = (parsed.data.config.templateVersion === 3 ? createEditorialRenderer : createPaperPageRenderer)(source, parsed.data.config, { publicBaseUrl: String(useRuntimeConfig(event).publicBaseUrl), uploadDirectory: getUploadDirectory(event), storage: getPublicStorage() })
  const document = renderer.document
  const page = Math.max(0, Math.min(parsed.data.page, document.pages.length - 1))
  const png = document.pages.length ? await renderer.render(page, parsed.data.thumbnail ? 55 : 150) : null
  setResponseHeaders(event, { 'Cache-Control': 'private, no-store' })
  return { previewToken: paperMapPreviewToken(source, parsed.data.config), image: png ? `data:image/png;base64,${png.toString('base64')}` : null, page, pageCount: document.pages.length, selectedCount: document.selectedCount, clippedCount: document.clippedCount, warnings: [...renderer.warnings], source, width: document.width, height: document.height, regions: 'regions' in document && document.pages[page] ? document.regions(document.pages[page] as never) : [] }
})
