import { z } from 'zod'

export const paperMapPurposes = ['MAP_FOCUS', 'GUIDE', 'PHOTO_GUIDE'] as const
export const paperMapLayouts = ['MAP_FOCUS', 'BALANCED', 'GUIDE'] as const
export const paperTemplateIds = ['map-classic', 'spot-guide', 'photo-story'] as const
export const paperSlotIds = ['intro', 'categoryLegend', 'spotGuide', 'photoFeature', 'qr', 'logo', 'footer'] as const

export type PaperTemplateId = typeof paperTemplateIds[number]
export type PaperSlotId = typeof paperSlotIds[number]

const uniqueIds = z.array(z.string().min(1)).max(200).refine(values => new Set(values).size === values.length, '同じ項目を重複して選択できません。')
const viewportSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('full') }),
  z.object({ mode: z.literal('fit_spots') }),
  z.object({ mode: z.literal('custom'), x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().positive().max(1), height: z.number().positive().max(1) }),
])

function validateSelectionAndViewport(value: { selectionMode: string, categoryIds: string[], spotIds: string[], order: string, manualSpotIds: string[], viewport: z.infer<typeof viewportSchema> }, context: z.RefinementCtx) {
  if (value.selectionMode === 'categories' && !value.categoryIds.length) context.addIssue({ code: 'custom', path: ['selection', 'categoryIds'], message: 'カテゴリーを1件以上選択してください。' })
  if (value.selectionMode === 'spots' && !value.spotIds.length) context.addIssue({ code: 'custom', path: ['selection', 'spotIds'], message: 'スポットを1件以上選択してください。' })
  if (value.order === 'manual' && !value.manualSpotIds.length) context.addIssue({ code: 'custom', path: ['ordering', 'spotIds'], message: '手動順のスポットを指定してください。' })
  if (value.viewport.mode === 'custom' && (value.viewport.x + value.viewport.width > 1 || value.viewport.y + value.viewport.height > 1)) context.addIssue({ code: 'custom', path: ['viewport'], message: '表示範囲がマップの外にはみ出しています。' })
}

export const paperMapConfigV1Schema = z.object({
  purpose: z.enum(paperMapPurposes), sourceMode: z.enum(['LIVE', 'PUBLISHED']), paper: z.enum(['A4', 'A3']), orientation: z.enum(['portrait', 'landscape']),
  layout: z.enum(paperMapLayouts), mapSize: z.enum(['large', 'standard', 'info']), selectionMode: z.enum(['recommended', 'categories', 'spots']), categoryIds: uniqueIds, spotIds: uniqueIds,
  density: z.enum(['names', 'standard', 'detail']), photos: z.enum(['none', 'featured', 'all']), order: z.enum(['auto', 'name', 'manual']), manualSpotIds: uniqueIds,
  qrEnabled: z.boolean(), qrLabel: z.string().trim().max(120), logoEnabled: z.boolean(), theme: z.enum(['brand', 'simple', 'warm', 'natural']), viewport: viewportSchema,
  title: z.string().trim().min(1, 'タイトルを入力してください。').max(120), subtitle: z.string().trim().max(240),
}).superRefine(validateSelectionAndViewport)

const slotStateSchema = z.partialRecord(z.enum(paperSlotIds), z.object({ visible: z.boolean(), modified: z.boolean().default(false) }))

export const paperMapConfigV2Schema = z.object({
  version: z.literal(2), templateId: z.enum(paperTemplateIds), templateVersion: z.literal(1), sourceMode: z.enum(['LIVE', 'PUBLISHED']), paper: z.enum(['A4', 'A3']), orientation: z.enum(['portrait', 'landscape']),
  selection: z.object({ mode: z.enum(['recommended', 'categories', 'spots']), categoryIds: uniqueIds, spotIds: uniqueIds }),
  ordering: z.object({ mode: z.enum(['auto', 'name', 'manual']), spotIds: uniqueIds }), viewport: viewportSchema,
  paperOriginal: z.object({ title: z.string().trim().min(1, 'タイトルを入力してください。').max(120), subtitle: z.string().trim().max(240), intro: z.string().trim().max(600), qrLabel: z.string().trim().max(120), footer: z.string().trim().max(240) }),
  slotState: slotStateSchema,
  spotOverrides: z.array(z.object({ spotId: z.string().min(1), summary: z.string().trim().min(1).max(400).optional() })).max(200).refine(values => new Set(values.map(value => value.spotId)).size === values.length, '同じスポットの紙面用文章を重複して保存できません。'),
  presentation: z.object({ theme: z.enum(['brand', 'simple', 'warm', 'natural']), photoMode: z.enum(['none', 'featured', 'all']), informationDensity: z.enum(['names', 'standard', 'detail']) }),
}).superRefine((value, context) => validateSelectionAndViewport({ selectionMode: value.selection.mode, categoryIds: value.selection.categoryIds, spotIds: value.selection.spotIds, order: value.ordering.mode, manualSpotIds: value.ordering.spotIds, viewport: value.viewport }, context))

export type PaperMapConfigV1 = z.infer<typeof paperMapConfigV1Schema>
export type PaperMapConfig = z.infer<typeof paperMapConfigV2Schema>
export type PaperMapPurpose = typeof paperMapPurposes[number]

export function migratePaperMapConfigV1(value: PaperMapConfigV1): PaperMapConfig {
  const templateId: PaperTemplateId = value.purpose === 'MAP_FOCUS' || value.layout === 'MAP_FOCUS' ? 'map-classic' : value.purpose === 'PHOTO_GUIDE' ? 'photo-story' : 'spot-guide'
  return paperMapConfigV2Schema.parse({
    version: 2, templateId, templateVersion: 1, sourceMode: value.sourceMode, paper: value.paper, orientation: value.orientation,
    selection: { mode: value.selectionMode, categoryIds: value.categoryIds, spotIds: value.spotIds }, ordering: { mode: value.order, spotIds: value.manualSpotIds }, viewport: value.viewport,
    paperOriginal: { title: value.title, subtitle: value.subtitle, intro: '', qrLabel: value.qrLabel, footer: '' },
    slotState: { intro: { visible: false, modified: false }, categoryLegend: { visible: true, modified: false }, spotGuide: { visible: true, modified: false }, photoFeature: { visible: value.photos !== 'none', modified: false }, qr: { visible: value.qrEnabled, modified: true }, logo: { visible: value.logoEnabled, modified: true }, footer: { visible: true, modified: false } },
    spotOverrides: [], presentation: { theme: value.theme, photoMode: value.photos, informationDensity: value.density },
  })
}

export function parsePaperMapConfig(value: unknown): PaperMapConfig {
  const v2 = paperMapConfigV2Schema.safeParse(value)
  if (v2.success) return v2.data
  const v1 = paperMapConfigV1Schema.safeParse(value)
  if (v1.success) return migratePaperMapConfigV1(v1.data)
  throw v2.error
}

export const paperMapConfigSchema = z.preprocess(value => parsePaperMapConfig(value), paperMapConfigV2Schema)
export const paperMapCreateSchema = z.object({ name: z.string().trim().min(1).max(120).optional(), templateId: z.enum(paperTemplateIds).optional(), purpose: z.enum(paperMapPurposes).optional() }).refine(value => value.templateId || value.purpose, 'テンプレートを選択してください。')
export const paperMapUpdateSchema = z.object({ name: z.string().trim().min(1).max(120), config: paperMapConfigV2Schema })
export const paperMapPdfSchema = z.object({ config: paperMapConfigV2Schema })
export const paperDesignRequestSchema = z.object({ paperMapId: z.string().min(1).nullable().optional(), contactName: z.string().trim().min(1).max(100), contactEmail: z.email().max(254), organizationName: z.string().trim().max(120), desiredUse: z.string().trim().min(1).max(1000), desiredDate: z.string().trim().max(40) })
