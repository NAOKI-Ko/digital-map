import type { PaperMapConfig, PaperTemplateId } from '../schemas/paper-map'
import type { PaperMapSource } from '../types/paper-map'
import { defaultPaperMapConfig } from './paper-map-templates'
export type PaperThemeId = 'heritage' | 'leisure' | 'alpine' | 'neutral'
export const paperDesignCatalog = [
  {
    id: 'heritage-map',
    name: '藍のまち案内',
    use: '地図と写真、地域の見どころを一枚に',
    theme: 'heritage',
    structure: 'map-classic',
    paper: 'A3',
    orientation: 'landscape',
  },
  {
    id: 'heritage-editorial',
    name: 'まちの小さな読本',
    use: '写真と紹介文をゆっくり読む案内冊子',
    theme: 'heritage',
    structure: 'photo-story',
    paper: 'A4',
    orientation: 'portrait',
  },
  {
    id: 'leisure-guide',
    name: 'カラフル・スポットガイド',
    use: '家族で見やすい写真と大きな番号',
    theme: 'leisure',
    structure: 'photo-story',
    paper: 'A3',
    orientation: 'landscape',
  },
  {
    id: 'alpine-map',
    name: 'マウンテン・アトラス',
    use: '大きな地図と明快な施設案内',
    theme: 'alpine',
    structure: 'map-classic',
    paper: 'A3',
    orientation: 'landscape',
  },
  {
    id: 'neutral-map',
    name: 'すっきり地図案内',
    use: '地図を中心に、場所をすばやく探す',
    theme: 'neutral',
    structure: 'map-classic',
    paper: 'A3',
    orientation: 'landscape',
  },
  {
    id: 'neutral-guide',
    name: '読みやすい地域ガイド',
    use: '写真が少なくても整う地図と紹介文',
    theme: 'neutral',
    structure: 'spot-guide',
    paper: 'A4',
    orientation: 'portrait',
  },
] as const
export type PaperDesignId = (typeof paperDesignCatalog)[number]['id']
export const offeredPaperDesignIds = ['heritage-map', 'heritage-editorial'] as const
export type OfferedPaperDesignId = (typeof offeredPaperDesignIds)[number]
export const offeredPaperDesignCatalog = paperDesignCatalog.filter(
  (design): design is (typeof paperDesignCatalog)[number] & { id: OfferedPaperDesignId } =>
    offeredPaperDesignIds.some(id => id === design.id),
)
export function isOfferedPaperDesignId(id: PaperDesignId): id is OfferedPaperDesignId {
  return offeredPaperDesignIds.some(offered => offered === id)
}
export function canUsePaperDesign(config: PaperMapConfig, saved?: PaperMapConfig): boolean {
  if (config.templateVersion !== 3) return true
  const id = paperDesignId(config)
  return isOfferedPaperDesignId(id)
    || (saved?.templateVersion === 3 && paperDesignId(saved) === id)
}
export const paperDesignTokens = {
  heritage: {
    name: '歴史・まち歩き',
    paper: '#faf7ef',
    ink: '#173a4b',
    primary: '#173a4b',
    secondary: '#e7e0d0',
    accent: '#aa533a',
    muted: '#52616a',
    radius: 1,
    titleFamily: "'Noto Serif CJK JP','Hiragino Mincho ProN','Yu Mincho',serif",
  },
  leisure: {
    name: 'ファミリーレジャー',
    paper: '#f3f9fc',
    ink: '#173658',
    primary: '#205983',
    secondary: '#d5ebf5',
    accent: '#b75609',
    muted: '#46596c',
    radius: 12,
    titleFamily: "'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif",
  },
  alpine: {
    name: 'マウンテン',
    paper: '#f2f7fa',
    ink: '#172d40',
    primary: '#176484',
    secondary: '#d8e9f0',
    accent: '#245578',
    muted: '#486172',
    radius: 0,
    titleFamily: "'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif",
  },
  neutral: {
    name: '地域の案内',
    paper: '#fbfcfa',
    ink: '#263d46',
    primary: '#37756f',
    secondary: '#e4ece6',
    accent: '#45665f',
    muted: '#50635f',
    radius: 3,
    titleFamily: "'Noto Sans CJK JP','Hiragino Sans','Yu Gothic',sans-serif",
  },
} as const
export const paperPrintTokens = {
  body: 9.5,
  bodyLeading: 12.5,
  name: 11,
  nameLeading: 14,
  metadata: 9,
  rule: 0.75,
  qr: 60,
  dpi: 240,
  jpegQuality: 94,
  gap: 16,
} as const
export function recommendPaperDesign(source: PaperMapSource) {
  const names = [
    ...new Set(
      source.map.floors.flatMap((f) =>
        f.spots.flatMap((s) => s.categories.map((c) => c.name)),
      ),
    ),
  ].join(' ')
  if (/歴史|文化|伝統|寺社|絞り/.test(names))
    return {
      id: 'heritage-map' as PaperDesignId,
      reason: '歴史・文化に関するカテゴリーがあるためおすすめ',
    }
  return {
    id: 'heritage-map' as PaperDesignId,
    reason: `公開・配置済み${source.spotCount}件を地図とともに案内します`,
  }
}
export function designSuitability(id: PaperDesignId, source: PaperMapSource) {
  const d = paperDesignCatalog.find((d) => d.id === id)!
  return d.structure === 'photo-story'
    ? source.photoCount / Math.max(1, source.spotCount) < 0.4
      ? '写真が少なめです。文字中心の構成になります'
      : `${source.photoCount}件の写真付きスポットを使えます`
    : `${source.spotCount}件のスポットを地図と案内に配置`
}
export function paperDesignConfig(
  id: PaperDesignId,
  source: PaperMapSource,
): PaperMapConfig {
  const d = paperDesignCatalog.find((d) => d.id === id)!
  const config = defaultPaperMapConfig(
    d.structure as PaperTemplateId,
    source.spotCount,
    source.map.name,
    2,
  )
  return {
    ...config,
    templateVersion: 3,
    design: { themeId: d.theme, themeVersion: 1, systemVersion: 1 },
    paper: d.paper,
    orientation: d.orientation,
    paperOriginal: {
      ...config.paperOriginal,
      sectionHeading: 'スポット案内',
      notice: '',
    },
    slotState: {
      ...config.slotState,
      photoFeature: { visible: true, modified: false },
      notice: { visible: false, modified: false },
    },
    photoChoices: [],
    presentation: {
      ...config.presentation,
      informationDensity: 'detail',
      photoMode: 'all',
    },
  }
}
export function switchPaperDesign(
  config: PaperMapConfig,
  id: PaperDesignId,
  source: PaperMapSource,
): PaperMapConfig {
  const next = paperDesignConfig(id, source)
  return {
    ...next,
    sourceMode: config.sourceMode,
    selection: {
      ...config.selection,
      categoryIds: [...config.selection.categoryIds],
      spotIds: [...config.selection.spotIds],
    },
    ordering: { ...config.ordering, spotIds: [...config.ordering.spotIds] },
    viewport: { ...config.viewport },
    paperOriginal: { ...next.paperOriginal, ...config.paperOriginal },
    spotOverrides: config.spotOverrides.map((item) => ({ ...item })),
    photoChoices: (config.photoChoices ?? []).map((item) => ({ ...item })),
    slotState: {
      ...next.slotState,
      ...Object.fromEntries(
        Object.entries(config.slotState)
          .filter(([, v]) => v?.modified)
          .map(([key, value]) => [key, { ...value }]),
      ),
    },
  }
}
export function paperDesignId(config: PaperMapConfig): PaperDesignId {
  return (
    paperDesignCatalog.find(
      (d) =>
        d.theme === config.design?.themeId && d.structure === config.templateId,
    )?.id ?? 'neutral-guide'
  )
}
