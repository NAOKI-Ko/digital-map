import type { CategoryCreateInput, CategoryUpdateInput } from '~~/shared/schemas/category'

type CategoryIconInput = Pick<CategoryCreateInput | CategoryUpdateInput, 'iconType' | 'iconPresetId' | 'iconImageUrl'>

export function isCategoryIconUrlForMap(url: string, mapId: string) {
  return url.startsWith(`/uploads/category-icon-${mapId}--`)
}

export function toCategoryIconData(input: CategoryIconInput, mapId: string) {
  if (input.iconType === undefined) return {}
  if (input.iconType === null) return { iconType: null, iconPresetId: null, iconImageUrl: null }
  if (input.iconType === 'preset') {
    return { iconType: 'preset', iconPresetId: input.iconPresetId!, iconImageUrl: null }
  }
  if (!input.iconImageUrl || !isCategoryIconUrlForMap(input.iconImageUrl, mapId)) {
    throw createError({ statusCode: 422, statusMessage: 'このマップへアップロードしたカテゴリー画像を選択してください。' })
  }
  return { iconType: 'custom', iconPresetId: null, iconImageUrl: input.iconImageUrl }
}
