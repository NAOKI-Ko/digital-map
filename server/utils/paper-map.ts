import { paperMapConfigSchema, type PaperMapConfig } from '~~/shared/schemas/paper-map'
import type { PaperMapRecord, PaperMapSource, PaperMapSummary } from '~~/shared/types/paper-map'
import type { PublicMap, PublicSpot } from '~~/shared/types/public-map'
import { recommendedSpotLimit, recommendPaperMapConfig } from '~~/shared/utils/paper-map-recommendation'
import { getLivePublicMapById } from './public-map'
import { loadReadyPublicSnapshot } from './public-release'
import { getPublicStorage } from './public-storage'

type StoredPaperMap = { id: string, mapId: string, name: string, configVersion: number, config: unknown, createdAt: Date, updatedAt: Date }

export function serializePaperMap(record: StoredPaperMap): PaperMapRecord {
  const config = paperMapConfigSchema.parse(record.config)
  return { id: record.id, mapId: record.mapId, name: record.name, configVersion: record.configVersion, config, purpose: config.purpose, paper: config.paper, orientation: config.orientation, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() }
}

export function serializePaperMapSummary(record: StoredPaperMap): PaperMapSummary {
  const { config: _config, ...summary } = serializePaperMap(record)
  return summary
}

export async function loadPaperMapSource(mapId: string, sourceMode: PaperMapConfig['sourceMode'], event?: Parameters<typeof useRuntimeConfig>[0]): Promise<PaperMapSource> {
  const record = await prisma.map.findUnique({ where: { id: mapId }, select: { slug: true, currentReleaseId: true, currentRelease: { select: { id: true, status: true, manifestKey: true } } } })
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
  return { mode: sourceMode, map, spotCount: map.floors.reduce((sum, floor) => sum + floor.spots.length, 0), categoryCount: categories.size }
}

export function selectPaperMapSpots(source: PaperMapSource, config: PaperMapConfig): PublicSpot[] {
  let spots = source.map.floors.flatMap(floor => floor.spots)
  if (config.selectionMode === 'categories') spots = spots.filter(spot => spot.categories.some(category => config.categoryIds.includes(category.id)))
  if (config.selectionMode === 'spots') spots = spots.filter(spot => config.spotIds.includes(spot.id))
  if (config.order === 'name') spots.sort((a, b) => a.name.localeCompare(b.name, 'ja') || a.id.localeCompare(b.id))
  else if (config.order === 'manual') {
    const positions = new Map(config.manualSpotIds.map((id, index) => [id, index]))
    spots.sort((a, b) => (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, 'ja'))
  }
  else spots.sort((a, b) => (a.importance === 'featured' ? -1 : 0) - (b.importance === 'featured' ? -1 : 0) || a.name.localeCompare(b.name, 'ja'))
  return spots
}

export function paperMapWarnings(source: PaperMapSource, config: PaperMapConfig) {
  const selected = selectPaperMapSpots(source, config)
  const allIds = new Set(source.map.floors.flatMap(floor => floor.spots.map(spot => spot.id)))
  const allCategoryIds = new Set(source.map.floors.flatMap(floor => floor.spots.flatMap(spot => spot.categories.map(category => category.id))))
  const warnings: string[] = []
  if (!selected.length) warnings.push('選択条件に一致する公開スポットがありません。')
  if (selected.length > recommendedSpotLimit(config)) warnings.push(`スポットが${selected.length}件あります。読みやすさの目安を超えているため、カテゴリーやスポットを絞ってください。`)
  if (config.spotIds.some(id => !allIds.has(id)) || config.categoryIds.some(id => !allCategoryIds.has(id))) warnings.push('保存後に削除された項目があります。現在存在する項目だけを出力します。')
  if (config.qrEnabled && !source.map.slug) warnings.push('QRコードに使用する公開URLがありません。')
  if (config.logoEnabled && !source.map.logoUrl) warnings.push('ロゴが未設定のため、ロゴなしで出力します。')
  if (config.photos !== 'none' && !selected.some(spot => spot.photos.length)) warnings.push('写真付きレイアウトですが、利用できる公開写真がありません。')
  return warnings
}

export async function defaultPaperMapConfig(mapId: string, purpose: Parameters<typeof recommendPaperMapConfig>[0]) {
  const source = await loadPaperMapSource(mapId, 'LIVE')
  return { source, config: recommendPaperMapConfig(purpose, source.spotCount, source.map.name) }
}
