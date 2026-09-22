import { z } from 'zod'
import { paperMapConfigV2Schema } from '~~/shared/schemas/paper-map'
import { loadPaperMapSource } from '~~/server/utils/paper-map'
import { createPaperPageRenderer } from '~~/server/utils/paper-map-document-renderer'
import { paperMapPreviewToken } from '~~/server/utils/paper-map-preview-token'
import { getPublicStorage } from '~~/server/utils/public-storage'

const schema = z.object({ config: paperMapConfigV2Schema, page: z.number().int().min(0).max(63).default(0) })
export default defineEventHandler(async (event) => {
  const { map } = await requireMapAccess(event)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success || parsed.data.config.templateVersion !== 2) throw createError({ statusCode: 422, statusMessage: '紙面の設定を確認してください。' })
  const source = await loadPaperMapSource(map.id, parsed.data.config.sourceMode, event)
  const renderer = createPaperPageRenderer(source, parsed.data.config, { publicBaseUrl: String(useRuntimeConfig(event).publicBaseUrl), uploadDirectory: getUploadDirectory(event), storage: getPublicStorage() })
  const document = renderer.document
  const page = Math.max(0, Math.min(parsed.data.page, document.pages.length - 1))
  const png = document.pages.length ? await renderer.render(page) : null
  setResponseHeaders(event, { 'Cache-Control': 'private, no-store' })
  return { previewToken: paperMapPreviewToken(source, parsed.data.config), image: png ? `data:image/png;base64,${png.toString('base64')}` : null, page, pageCount: document.pages.length, selectedCount: document.selectedCount, clippedCount: document.clippedCount, warnings: [...renderer.warnings], source }
})
