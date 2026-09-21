import { z } from 'zod'

export const paperMapPurposes = ['MAP_FOCUS', 'GUIDE', 'PHOTO_GUIDE'] as const
export const paperMapLayouts = ['MAP_FOCUS', 'BALANCED', 'GUIDE'] as const

const uniqueIds = z.array(z.string().min(1)).max(200).refine(values => new Set(values).size === values.length, '同じ項目を重複して選択できません。')

export const paperMapConfigSchema = z.object({
  purpose: z.enum(paperMapPurposes),
  sourceMode: z.enum(['LIVE', 'PUBLISHED']),
  paper: z.enum(['A4', 'A3']),
  orientation: z.enum(['portrait', 'landscape']),
  layout: z.enum(paperMapLayouts),
  mapSize: z.enum(['large', 'standard', 'info']),
  selectionMode: z.enum(['recommended', 'categories', 'spots']),
  categoryIds: uniqueIds,
  spotIds: uniqueIds,
  density: z.enum(['names', 'standard', 'detail']),
  photos: z.enum(['none', 'featured', 'all']),
  order: z.enum(['auto', 'name', 'manual']),
  manualSpotIds: uniqueIds,
  qrEnabled: z.boolean(),
  qrLabel: z.string().trim().max(120),
  logoEnabled: z.boolean(),
  theme: z.enum(['brand', 'simple', 'warm', 'natural']),
  viewport: z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('full') }),
    z.object({ mode: z.literal('fit_spots') }),
    z.object({ mode: z.literal('custom'), x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().positive().max(1), height: z.number().positive().max(1) }),
  ]),
  title: z.string().trim().min(1, 'タイトルを入力してください。').max(120),
  subtitle: z.string().trim().max(240),
}).superRefine((value, context) => {
  if (value.selectionMode === 'categories' && !value.categoryIds.length) context.addIssue({ code: 'custom', path: ['categoryIds'], message: 'カテゴリーを1件以上選択してください。' })
  if (value.selectionMode === 'spots' && !value.spotIds.length) context.addIssue({ code: 'custom', path: ['spotIds'], message: 'スポットを1件以上選択してください。' })
  if (value.order === 'manual' && !value.manualSpotIds.length) context.addIssue({ code: 'custom', path: ['manualSpotIds'], message: '手動順のスポットを指定してください。' })
  if (value.viewport.mode === 'custom' && (value.viewport.x + value.viewport.width > 1 || value.viewport.y + value.viewport.height > 1)) context.addIssue({ code: 'custom', path: ['viewport'], message: '表示範囲がマップの外にはみ出しています。' })
})

export const paperMapCreateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  purpose: z.enum(paperMapPurposes),
})

export const paperMapUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  config: paperMapConfigSchema,
})

export const paperMapPdfSchema = z.object({ config: paperMapConfigSchema })

export const paperDesignRequestSchema = z.object({
  paperMapId: z.string().min(1).nullable().optional(),
  contactName: z.string().trim().min(1).max(100),
  contactEmail: z.email().max(254),
  organizationName: z.string().trim().max(120),
  desiredUse: z.string().trim().min(1).max(1000),
  desiredDate: z.string().trim().max(40),
})

export type PaperMapConfig = z.infer<typeof paperMapConfigSchema>
export type PaperMapPurpose = typeof paperMapPurposes[number]
