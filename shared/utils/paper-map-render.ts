import type { PaperMapConfig } from '../schemas/paper-map'
import type { PaperMapSource } from '../types/paper-map'
import type { PublicSpot } from '../types/public-map'
import { containRect, paperPageSize, resolveViewport, viewportPoint, type PaperRect } from './paper-map-layout'
import { resolvePaperTemplate, slotVisible } from './paper-map-templates'

export interface PaperRenderSpot extends PublicSpot { number: number, summary: string, point?: { x: number, y: number } }
export interface PaperRenderModel { size: ReturnType<typeof paperPageSize>, template: ReturnType<typeof resolvePaperTemplate>, title: string, subtitle: string, intro: string, footer: string, qrLabel: string, mapFrame: PaperRect, infoFrame: PaperRect, imageRect: PaperRect, floor: PaperMapSource['map']['floors'][number] | undefined, spots: PaperRenderSpot[], categories: string[], photos: PaperRenderSpot[], visible: (slot: Parameters<typeof slotVisible>[1]) => boolean, viewport: ReturnType<typeof resolveViewport>, warnings: string[] }

export function selectPaperMapSpotsFromSource(source: PaperMapSource, config: PaperMapConfig) {
  let spots = source.map.floors.flatMap(floor => floor.spots)
  if (config.selection.mode === 'categories') spots = spots.filter(spot => spot.categories.some(category => config.selection.categoryIds.includes(category.id)))
  if (config.selection.mode === 'spots') spots = spots.filter(spot => config.selection.spotIds.includes(spot.id))
  if (config.ordering.mode === 'name') spots.sort((a, b) => a.name.localeCompare(b.name, 'ja') || a.id.localeCompare(b.id))
  else if (config.ordering.mode === 'manual') {
    const positions = new Map(config.ordering.spotIds.map((id, index) => [id, index]))
    spots.sort((a, b) => (positions.get(a.id) ?? 9999) - (positions.get(b.id) ?? 9999) || a.name.localeCompare(b.name, 'ja'))
  }
  else spots.sort((a, b) => Number(b.importance === 'featured') - Number(a.importance === 'featured') || a.name.localeCompare(b.name, 'ja'))
  return spots
}

export function resolvePaperRenderModel(source: PaperMapSource, config: PaperMapConfig, dpi = 300): PaperRenderModel {
  const template = resolvePaperTemplate(config.templateId, config.templateVersion)
  const size = paperPageSize(config.paper, config.orientation, dpi)
  const margin = size.widthPx * 0.048
  const header = size.heightPx * (slotVisible(config, 'intro') && config.paperOriginal.intro ? 0.17 : 0.12)
  const footer = size.heightPx * 0.07
  const content = { x: margin, y: margin + header, width: size.widthPx - margin * 2, height: size.heightPx - margin * 2 - header - footer }
  const gap = margin * 0.55
  const mapFrame: PaperRect = config.orientation === 'landscape' ? { ...content, width: content.width * template.mapRatio } : { ...content, height: content.height * template.mapRatio }
  const infoFrame: PaperRect = config.orientation === 'landscape' ? { x: mapFrame.x + mapFrame.width + gap, y: content.y, width: content.width - mapFrame.width - gap, height: content.height } : { x: content.x, y: mapFrame.y + mapFrame.height + gap, width: content.width, height: content.height - mapFrame.height - gap }
  const selected = selectPaperMapSpotsFromSource(source, config)
  const floor = source.map.floors.find(item => item.spots.some(spot => selected.some(selectedSpot => selectedSpot.id === spot.id))) ?? source.map.floors[0]
  const floorSpots = floor?.spots.filter(spot => selected.some(selectedSpot => selectedSpot.id === spot.id)) ?? []
  const viewport = resolveViewport(config, floorSpots.map(spot => ({ x: spot.x, y: spot.y })))
  const imageRect = floor ? containRect(floor.imageWidth * viewport.width, floor.imageHeight * viewport.height, mapFrame) : mapFrame
  const overrideMap = new Map(config.spotOverrides.map(item => [item.spotId, item.summary]))
  const spots = selected.map((spot, index): PaperRenderSpot => ({ ...spot, number: index + 1, summary: overrideMap.get(spot.id) || spot.description || spot.informationFields[0]?.value || '', point: floor?.id === spot.floorId ? viewportPoint(spot, viewport, imageRect) : undefined }))
  const categories = [...new Set(spots.flatMap(spot => spot.categories.map(category => category.name)))]
  const photos = config.presentation.photoMode === 'none' ? [] : spots.filter(spot => spot.photos.length).slice(0, config.presentation.photoMode === 'featured' ? 4 : 8)
  const warnings: string[] = []
  if (!spots.length) warnings.push('選択条件に一致する公開スポットがありません。')
  if (config.templateId === 'photo-story' && photos.length < 3) warnings.push('利用できる写真が少ないため、写真のない項目は文章カードで表示します。')
  if (slotVisible(config, 'logo') && !source.map.logoUrl) warnings.push('ロゴが未設定のため、ロゴなしで出力します。')
  return { size, template, title: config.paperOriginal.title, subtitle: config.paperOriginal.subtitle || floor?.name || '', intro: config.paperOriginal.intro, footer: config.paperOriginal.footer, qrLabel: config.paperOriginal.qrLabel, mapFrame, infoFrame, imageRect, floor, spots, categories, photos, visible: slotId => slotVisible(config, slotId), viewport, warnings }
}
