import type { PaperMapConfig, PaperSlotId, PaperTemplateId } from '../schemas/paper-map'

export type PaperContentOwnership = 'SOURCE' | 'PAPER_OVERRIDE' | 'PAPER_ORIGINAL'
export interface PaperTemplateSlot { id: PaperSlotId, kind: 'text' | 'map' | 'guide' | 'photos' | 'qr' | 'logo' | 'footer', defaultVisible: boolean, visibilityEditable: boolean, ownership: PaperContentOwnership, editable: boolean, maxLength?: number }
export interface PaperTemplateDefinition { id: PaperTemplateId, version: 1, name: string, description: string, mapRatio: number, slots: readonly PaperTemplateSlot[] }

const commonSlots = [
  { id: 'intro', kind: 'text', defaultVisible: false, visibilityEditable: true, ownership: 'PAPER_ORIGINAL', editable: true, maxLength: 600 },
  { id: 'categoryLegend', kind: 'guide', defaultVisible: true, visibilityEditable: true, ownership: 'SOURCE', editable: false },
  { id: 'spotGuide', kind: 'guide', defaultVisible: true, visibilityEditable: true, ownership: 'PAPER_OVERRIDE', editable: true },
  { id: 'qr', kind: 'qr', defaultVisible: true, visibilityEditable: true, ownership: 'PAPER_ORIGINAL', editable: true, maxLength: 120 },
  { id: 'logo', kind: 'logo', defaultVisible: true, visibilityEditable: true, ownership: 'SOURCE', editable: false },
  { id: 'footer', kind: 'footer', defaultVisible: true, visibilityEditable: true, ownership: 'PAPER_ORIGINAL', editable: true, maxLength: 240 },
] as const satisfies readonly PaperTemplateSlot[]

export const paperTemplateCatalog: readonly PaperTemplateDefinition[] = [
  { id: 'map-classic', version: 1, name: '地図を主役に', description: '地図を大きく見せたい方向け', mapRatio: 0.7, slots: commonSlots },
  { id: 'spot-guide', version: 1, name: 'スポットガイド', description: '地図とスポット情報をバランスよく', mapRatio: 0.55, slots: commonSlots },
  { id: 'photo-story', version: 1, name: '写真でめぐる', description: '写真を使って見どころを紹介', mapRatio: 0.45, slots: [...commonSlots, { id: 'photoFeature', kind: 'photos', defaultVisible: true, visibilityEditable: true, ownership: 'SOURCE', editable: false }] },
]

export function resolvePaperTemplate(id: PaperTemplateId, version: number) {
  const template = paperTemplateCatalog.find(item => item.id === id && item.version === version)
  if (!template) throw new Error(`Unknown paper template version: ${id}@${version}`)
  return template
}

export function templateSuitability(input: { spotCount: number, photoCount: number }) {
  const photoCoverage = input.spotCount ? input.photoCount / input.spotCount : 0
  const recommended: PaperTemplateId = input.spotCount <= 12 && input.photoCount >= 3 && photoCoverage >= 0.4 ? 'photo-story' : input.spotCount <= 24 ? 'spot-guide' : 'map-classic'
  const reason = recommended === 'photo-story' ? `写真が${input.photoCount}件あるのでおすすめ` : recommended === 'map-classic' ? `スポット数が${input.spotCount}件のため地図中心がおすすめ` : '地図と案内を読みやすく配置できます'
  return { recommended, reason, photoCoverage }
}

export function defaultPaperMapConfig(templateId: PaperTemplateId, spotCount: number, title: string): PaperMapConfig {
  const template = resolvePaperTemplate(templateId, 1)
  const slotState = Object.fromEntries(template.slots.map(slot => [slot.id, { visible: slot.defaultVisible, modified: false }]))
  return { version: 2, templateId, templateVersion: 1, sourceMode: 'LIVE', paper: spotCount > 40 ? 'A3' : 'A4', orientation: templateId === 'map-classic' ? 'landscape' : 'portrait', selection: { mode: 'recommended', categoryIds: [], spotIds: [] }, ordering: { mode: 'auto', spotIds: [] }, viewport: { mode: 'fit_spots' }, paperOriginal: { title, subtitle: '', intro: '', qrLabel: '詳しい情報はWebマップで', footer: '' }, slotState, spotOverrides: [], presentation: { theme: 'brand', photoMode: templateId === 'photo-story' ? 'featured' : 'none', informationDensity: spotCount > 40 ? 'names' : 'detail' } }
}

export function switchPaperTemplate(config: PaperMapConfig, templateId: PaperTemplateId): PaperMapConfig {
  const destination = resolvePaperTemplate(templateId, 1)
  const slotState = { ...config.slotState }
  for (const slot of destination.slots) if (!slotState[slot.id]?.modified) slotState[slot.id] = { visible: slot.defaultVisible, modified: false }
  return { ...config, templateId, templateVersion: 1, slotState, presentation: { ...config.presentation, photoMode: templateId === 'photo-story' && config.presentation.photoMode === 'none' ? 'featured' : config.presentation.photoMode } }
}

export function slotVisible(config: PaperMapConfig, slotId: PaperSlotId) {
  const slot = resolvePaperTemplate(config.templateId, config.templateVersion).slots.find(item => item.id === slotId)
  return Boolean(slot && (config.slotState[slotId]?.visible ?? slot.defaultVisible))
}
