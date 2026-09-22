import { parsePaperMapConfig, type PaperMapConfig, type PaperTemplateId } from '~~/shared/schemas/paper-map'
import type { PaperMapRecord, PaperMapSource, PaperMapSummary } from '~~/shared/types/paper-map'
import type { PublicMap, PublicSpot } from '~~/shared/types/public-map'
import { resolvePaperDocument } from '~~/shared/utils/paper-map-document'
import { recommendedSpotLimit } from '~~/shared/utils/paper-map-recommendation'
import { defaultPaperMapConfig as createDefaultPaperMapConfig } from '~~/shared/utils/paper-map-templates'
import { resolvePaperRenderModel, selectPaperMapSpotsFromSource } from '~~/shared/utils/paper-map-render'
import { getLivePublicMapById } from './public-map'
import { loadReadyPublicSnapshot } from './public-release'
import { getPublicStorage } from './public-storage'

type StoredPaperMap = { id: string, mapId: string, name: string, configVersion: number, config: unknown, createdAt: Date, updatedAt: Date }

export function serializePaperMap(record: StoredPaperMap): PaperMapRecord {
  const config = parsePaperMapConfig(record.config)
  return { id: record.id, mapId: record.mapId, name: record.name, configVersion: 2, config, templateId: config.templateId, templateVersion: config.templateVersion, paper: config.paper, orientation: config.orientation, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() }
}

export function serializePaperMapSummary(record: StoredPaperMap): PaperMapSummary {
  const { config: _config, ...summary } = serializePaperMap(record)
  return summary
}

export async function loadPaperMapSource(mapId: string, sourceMode: PaperMapConfig['sourceMode'], event?: Parameters<typeof useRuntimeConfig>[0]): Promise<PaperMapSource> {
  const record = await prisma.map.findUnique({ where: { id: mapId }, select: { slug: true, isPublished: true, currentReleaseId: true, currentRelease: { select: { id: true, status: true, manifestKey: true } } } })
  if (!record) throw createError({ statusCode: 404, statusMessage: 'マップが見つかりません。' })
  let map: PublicMap | null = null
  if (sourceMode === 'PUBLISHED') {
    if (!record.currentReleaseId || record.currentRelease?.status !== 'READY' || !record.currentRelease.manifestKey) throw createError({ statusCode: 409, statusMessage: '利用できる公開版がありません。先にマップを公開してください。' })
    map = await loadReadyPublicSnapshot(record.currentRelease.manifestKey, record.currentRelease.id, 'ja', getPublicStorage())
    if (!map) throw createError({ statusCode: 409, statusMessage: '現在の公開版を読み込めません。公開状態を確認してください。' })
  }
  else map = await getLivePublicMapById(mapId, 'ja')
  if (!map) throw createError({ statusCode: 409, statusMessage: '紙マップに使えるデータがありません。' })
  const categories = new Set(map.floors.flatMap(floor => floor.spots.flatMap(spot => spot.categories.map(category => category.id))))
  return { mode: sourceMode, publicUrlAvailable: record.isPublished && record.currentRelease?.status === 'READY', map, spotCount: map.floors.reduce((sum, floor) => sum + floor.spots.length, 0), categoryCount: categories.size, photoCount: map.floors.reduce((sum, floor) => sum + floor.spots.filter(spot => spot.photos.length).length, 0) }
}

export function selectPaperMapSpots(source: PaperMapSource, config: PaperMapConfig): PublicSpot[] { return selectPaperMapSpotsFromSource(source, config) }

export function paperMapWarnings(source: PaperMapSource, config: PaperMapConfig) {
  const selected = selectPaperMapSpots(source, config)
  const allIds = new Set(source.map.floors.flatMap(floor => floor.spots.map(spot => spot.id)))
  const allCategoryIds = new Set(source.map.floors.flatMap(floor => floor.spots.flatMap(spot => spot.categories.map(category => category.id))))
  const warnings: string[] = []
  if (!selected.length) warnings.push('選択条件に一致する公開スポットがありません。')
  if (selected.length > recommendedSpotLimit(config)) warnings.push(`スポットが${selected.length}件あります。読みやすさの目安を超えているため、カテゴリーやスポットを絞ってください。`)
  if (config.selection.spotIds.some(id => !allIds.has(id)) || config.selection.categoryIds.some(id => !allCategoryIds.has(id)) || config.spotOverrides.some(item => !allIds.has(item.spotId))) warnings.push('保存後に削除された項目があります。現在存在する項目だけを出力します。')
  warnings.push(...(config.templateVersion === 2 ? resolvePaperDocument(source, config) : resolvePaperRenderModel(source, config)).warnings.filter(warning => !warnings.includes(warning)))
  return warnings
}

export async function defaultNewPaperMapConfig(mapId: string, templateId: PaperTemplateId) {
  const source = await loadPaperMapSource(mapId, 'LIVE')
  return { source, config: createDefaultPaperMapConfig(templateId, source.spotCount, source.map.name) }
}

export function validatePaperMapReferences(source: PaperMapSource, config: PaperMapConfig) {
  const spotIds = new Set(source.map.floors.flatMap(floor => floor.spots.map(spot => spot.id)))
  const categoryIds = new Set(source.map.floors.flatMap(floor => floor.spots.flatMap(spot => spot.categories.map(category => category.id))))
  if (config.selection.spotIds.some(id => !spotIds.has(id)) || config.selection.categoryIds.some(id => !categoryIds.has(id)) || config.ordering.spotIds.some(id => !spotIds.has(id)) || config.spotOverrides.some(item => !spotIds.has(item.spotId))) throw createError({ statusCode: 422, statusMessage: 'このマップに存在しないスポットまたはカテゴリーは保存できません。' })
}
