import { getMaterialSymbolPreset, isMaterialSymbolPresetId, materialSymbolPresets } from './icon-presets'

export const categoryIconTypes = ['preset', 'custom'] as const
export type CategoryIconType = typeof categoryIconTypes[number]
export const categoryIconPresets = materialSymbolPresets

export { getMaterialSymbolPreset as getCategoryIconPreset, isMaterialSymbolPresetId as isCategoryIconPresetId }
