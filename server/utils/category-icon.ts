import type { CategoryCreateInput, CategoryUpdateInput } from '~~/shared/schemas/category'

type CategoryIconInput = Pick<CategoryCreateInput | CategoryUpdateInput, 'iconType' | 'iconPresetId' | 'iconImageUrl' | 'iconAssetId'>

export function isCategoryIconUrlForMap(url: string, mapId: string) {
  return url.startsWith(`/uploads/category-icon-${mapId}--`)
}

export function toCategoryIconData(input: CategoryIconInput, mapId: string, asset?: { id: string, url: string } | null) {
  if (input.iconType === undefined) return {}
  if (input.iconType === null) return { iconType: null, iconPresetId: null, iconImageUrl: null, iconAssetId: null }
  if (input.iconType === 'preset') {
    return { iconType: 'preset', iconPresetId: input.iconPresetId!, iconImageUrl: null, iconAssetId: null }
  }
  if (asset) return { iconType: 'custom', iconPresetId: null, iconImageUrl: asset.url, iconAssetId: asset.id }
  if (!input.iconImageUrl || !isCategoryIconUrlForMap(input.iconImageUrl, mapId)) {
    throw createError({ statusCode: 422, statusMessage: 'このマップへアップロードしたカテゴリー画像を選択してください。' })
  }
  return { iconType: 'custom', iconPresetId: null, iconImageUrl: input.iconImageUrl, iconAssetId: null }
}
