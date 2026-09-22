import type { PaperMapConfig, PaperSlotId } from '../schemas/paper-map'
import type { PaperMapSource } from '../types/paper-map'
import type { PublicFloor, PublicSpot } from '../types/public-map'
import {
  paperPageSize,
  containRect,
  resolveViewport,
  type PaperRect,
} from './paper-map-layout'
import { selectPaperMapSpotsFromSource } from './paper-map-render'
import { slotVisible } from './paper-map-templates'
import { paperDesignTokens, type PaperThemeId } from './paper-map-designs'
export interface EditorialText {
  lines: string[]
  clipped: boolean
}
const advance = (s: string, size: number) =>
  Array.from(s).reduce(
    (n, c) => n + (/[\u0020-\u007e]/.test(c) ? size * 0.6 : size),
    0,
  )
const headProhibited =
  /^[、。，．？！：；）〕］｝〉》」』】ー々ぁぃぅぇぉっゃゅょァィゥェォッャュョ]/
const tailProhibited = /[（〔［｛〈《「『【]$/
export function editorialText(
  value: string,
  width: number,
  size: number,
  maxLines: number,
): EditorialText {
  const lines: string[] = []
  let line = ''
  for (const c of Array.from(value.replace(/\r/g, ''))) {
    if (c === '\n') {
      lines.push(line)
      line = ''
      continue
    }
    if (line && advance(line + c, size) > width) {
      let carry = ''
      while (tailProhibited.test(line) || (headProhibited.test(c) && !carry)) {
        const chars = Array.from(line)
        carry = (chars.pop() ?? '') + carry
        line = chars.join('')
        if (!line) break
      }
      if (line) lines.push(line)
      line = carry
    }
    line += c
  }
  if (line) lines.push(line)
  const shown = lines.slice(0, maxLines),
    clipped = lines.length > maxLines
  if (clipped && shown.length)
    shown[shown.length - 1] =
      Array.from(shown.at(-1)!).slice(0, -1).join('') + '…'
  return { lines: shown, clipped }
}
export interface EditorialCard {
  spot: PublicSpot
  number: number
  rect: PaperRect
  name: EditorialText
  summary: EditorialText
  category: EditorialText
  photo: string | null
  photoHeight: number
}
export interface EditorialFeature {
  spot: PublicSpot
  number: number
  photo: string
  rect: PaperRect
}
export interface EditorialPage {
  floor: PublicFloor
  viewport: ReturnType<typeof resolveViewport>
  mapFrame?: PaperRect
  imageRect?: PaperRect
  guideFrame: PaperRect
  cards: EditorialCard[]
  features: EditorialFeature[]
  continuation: boolean
}
export interface EditorialRegion extends PaperRect {
  slot: PaperSlotId | 'title'
  label: string
  spotId?: string
}
export function resolveEditorialDocument(
  source: PaperMapSource,
  config: PaperMapConfig,
) {
  if (config.templateVersion !== 3 || !config.design)
    throw new Error('Editorial document requires explicit version 3 design')
  const themeId: PaperThemeId = config.design.themeId,
    theme = paperDesignTokens[themeId]
  const size = paperPageSize(config.paper, config.orientation),
    width = size.widthPoints,
    height = size.heightPoints
  const margin = config.paper === 'A3' ? 28 : 26,
    gap = 16,
    contentWidth = width - margin * 2
  const title = editorialText(
    config.paperOriginal.title,
    contentWidth - (source.map.logoUrl && slotVisible(config, 'logo') ? 90 : 0),
    32,
    2,
  )
  const subtitle = editorialText(
    config.paperOriginal.subtitle || source.map.organizationName || '',
    contentWidth - 100,
    10,
    2,
  )
  const intro = editorialText(
    slotVisible(config, 'intro') ? config.paperOriginal.intro : '',
    contentWidth,
    10,
    3,
  )
  const notice = editorialText(
    slotVisible(config, 'notice') ? (config.paperOriginal.notice ?? '') : '',
    contentWidth - 24,
    9.5,
    2,
  )
  const headerHeight =
    title.lines.length * 38 +
    subtitle.lines.length * 14 +
    (intro.lines.length ? intro.lines.length * 14 + 8 : 0) +
    (notice.lines.length ? notice.lines.length * 12 + 16 : 0) +
    22
  const content: PaperRect = {
    x: margin,
    y: margin + headerHeight,
    width: contentWidth,
    height: height - margin * 2 - headerHeight - 68,
  }
  const selected = selectPaperMapSpotsFromSource(source, config),
    numbers = new Map(selected.map((s, i) => [s.id, i + 1]))
  const categories = [
    ...new Map(
      selected.flatMap((s) => s.categories.map((c) => [c.id, c] as const)),
    ).values(),
  ].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ja'))
  const photosVisible =
    config.presentation.photoMode !== 'none' &&
    (config.slotState.photoFeature?.visible ?? true)
  const choices = new Map(
    config.photoChoices?.map((c) => [c.spotId, c.url]) ?? [],
  )
  const invalidPhotos = selected.filter(
    (s) => choices.has(s.id) && !s.photos.includes(choices.get(s.id)!),
  )
  const photoOf = (spot: PublicSpot) =>
    photosVisible
      ? spot.photos.includes(choices.get(spot.id)!)
        ? choices.get(spot.id)!
        : (spot.photos[0] ?? null)
      : null
  const overrides = new Map(
    config.spotOverrides.map((s) => [s.spotId, s.summary]),
  )
  const pages: EditorialPage[] = [],
    warnings: string[] = []
  const sourceSpots = source.map.floors.flatMap(floor => floor.spots)
  const sourceSpotIds = new Set(sourceSpots.map(spot => spot.id))
  const sourceCategoryIds = new Set(sourceSpots.flatMap(spot => spot.categories.map(category => category.id)))
  if (config.selection.spotIds.some(id => !sourceSpotIds.has(id))
    || config.selection.categoryIds.some(id => !sourceCategoryIds.has(id))
    || config.ordering.spotIds.some(id => !sourceSpotIds.has(id))
    || config.spotOverrides.some(item => !sourceSpotIds.has(item.spotId))
    || config.photoChoices?.some(item => !sourceSpotIds.has(item.spotId))) {
    warnings.push('保存後に元データから削除された項目があります。現在存在する項目だけを出力します。')
  }
  let clippedCount = [title, subtitle, intro, notice].filter(
    (t) => t.clipped,
  ).length
  for (const floor of source.map.floors) {
    const spots = selected.filter((s) => s.floorId === floor.id)
    if (!spots.length) continue
    const viewport = resolveViewport(config, spots),
      guide = slotVisible(config, 'spotGuide')
    let mapFrame: PaperRect, guideFrame: PaperRect
    if (!guide) {
      mapFrame = { ...content }
      guideFrame = { ...content, height: 0 }
    } else if (config.orientation === 'landscape') {
      const ratio =
        config.templateId === 'photo-story'
          ? 0.43
          : themeId === 'alpine'
            ? 0.6
            : 0.52
      mapFrame = { ...content, width: (content.width - gap) * ratio }
      guideFrame = {
        x: content.x + mapFrame.width + gap,
        y: content.y,
        width: content.width - mapFrame.width - gap,
        height: content.height,
      }
    } else {
      const mapHeight = Math.min(
        config.templateId === 'photo-story' ? 290 : 270,
        content.height * 0.49,
      )
      mapFrame = { ...content, height: mapHeight }
      guideFrame = {
        ...content,
        y: content.y + mapHeight + 22,
        height: content.height - mapHeight - 22,
      }
    }
    const featureSpots: PublicSpot[] = [],
      seen = new Set<string>()
    if (config.orientation === 'landscape')
      for (const s of spots) {
        const p = photoOf(s)
        if (
          p &&
          !seen.has(p) &&
          featureSpots.length < (themeId === 'alpine' && guide ? 2 : 3)
        ) {
          featureSpots.push(s)
          seen.add(p)
        }
      }
    const guidePhotos =
      themeId === 'alpine' && guide && config.orientation === 'landscape'
    const featureFrame = guidePhotos ? { ...guideFrame } : mapFrame
    const featureHeight = featureSpots.length
      ? Math.min(
          guidePhotos ? 180 : 120,
          mapFrame.height * (guidePhotos ? 0.3 : 0.25),
        )
      : 0
    const imageFrame = {
      ...mapFrame,
      height:
        mapFrame.height -
        (guidePhotos ? 0 : featureHeight + (featureHeight ? 26 : 0)) -
        34,
      y: mapFrame.y + 34,
    }
    const imageRect = containRect(
      floor.imageWidth * viewport.width,
      floor.imageHeight * viewport.height,
      imageFrame,
    )
    const features = featureSpots.map((spot, i) => ({
      spot,
      number: numbers.get(spot.id)!,
      photo: photoOf(spot)!,
      rect: {
        x: featureFrame.x + i * (featureFrame.width / featureSpots.length),
        y: featureFrame.y + featureFrame.height - featureHeight,
        width: featureFrame.width / featureSpots.length - 8,
        height: featureHeight - 16,
      },
    }))
    if (guidePhotos && featureHeight)
      guideFrame = {
        ...guideFrame,
        height: guideFrame.height - featureHeight - 24,
      }
    let page: EditorialPage = {
      floor,
      viewport,
      mapFrame,
      imageRect,
      guideFrame,
      cards: [],
      features,
      continuation: false,
    }
    pages.push(page)
    if (!guide) continue
    let index = 0
    while (index < spots.length) {
      const frame = page.guideFrame
      const columns =
          frame.width >= 760
            ? config.templateId === 'photo-story'
              ? 4
              : 3
            : frame.width >= 380
              ? 2
              : 1,
        cardWidth = (frame.width - gap * (columns - 1)) / columns
      const finalPhotoPage =
        page.continuation &&
        config.orientation === 'portrait' &&
        spots.length - index <= columns * 3 &&
        spots.slice(index).filter(photoOf).length <= columns * 2
      const heights = Array.from({ length: columns }, () => frame.y + 30)
      while (index < spots.length) {
        const spot = spots[index]!
        const photo = config.templateId === 'photo-story' ? photoOf(spot) : null
        const photoHeight = photo
          ? (cardWidth - 20) /
            (page.continuation
              ? config.orientation === 'portrait'
                ? finalPhotoPage
                  ? 4 / 3
                  : 2
                : 4 / 3
              : config.orientation === 'portrait'
                ? 1.6
                : 1.5)
          : 0
        const textWidth =
          cardWidth - (config.templateId === 'map-classic' ? 60 : 40)
        const name = editorialText(spot.name, textWidth, 11, 2)
        const category = editorialText(
          slotVisible(config, 'categoryLegend') &&
            config.templateId !== 'map-classic'
            ? spot.categories.map((c) => c.name).join(' / ')
            : '',
          textWidth,
          9,
          1,
        )
        const summary = editorialText(
          config.presentation.informationDensity === 'detail'
            ? overrides.get(spot.id) || spot.description || ''
            : '',
          cardWidth - 20,
          9.5,
          config.templateId === 'photo-story' ? 3 : 2,
        )
        const textHeight =
          name.lines.length * 14 +
          category.lines.length * 12 +
          summary.lines.length * 12.5 +
          12
        const cardHeight = Math.max(
          44,
          photoHeight + textHeight + (photo ? 10 : 0),
        )
        // Fill the shortest column. Photo-free cards use only their text height.
        const column = heights.indexOf(Math.min(...heights)),
          y = heights[column]!
        if (y + cardHeight > frame.y + frame.height) break
        page.cards.push({
          spot,
          number: numbers.get(spot.id)!,
          name,
          category,
          summary,
          photo,
          photoHeight,
          rect: {
            x: frame.x + column * (cardWidth + gap),
            y,
            width: cardWidth,
            height: cardHeight,
          },
        })
        clippedCount += [name, category, summary].filter(
          (t) => t.clipped,
        ).length
        heights[column] = y + cardHeight + 8
        index++
      }
      if (index >= spots.length) break
      if (page.continuation && !page.cards.length)
        throw new Error(
          'この文字量では紙面に収まりません。導入文を短くしてください。',
        )
      page = {
        floor,
        viewport,
        guideFrame: { ...content },
        cards: [],
        features: [],
        continuation: true,
      }
      pages.push(page)
      if (pages.length > 64)
        throw new Error('紙面が64ページを超えます。掲載数を絞ってください。')
    }
  }
  if (!selected.length) warnings.push('公開・配置済みのスポットがありません。')
  if (clippedCount)
    warnings.push(
      `${clippedCount}か所の長文を省略しています。紙専用の文章で調整できます。`,
    )
  if (invalidPhotos.length)
    warnings.push(
      '選択していた写真が元データにないため、現在の写真を使います。',
    )
  if (
    config.templateId === 'photo-story' &&
    selected.filter((s) => s.photos.length).length /
      Math.max(selected.length, 1) <
      0.4
  )
    warnings.push(
      '写真が少ないため文字中心で組版しています。地図中心のデザインもお試しください。',
    )
  if (slotVisible(config, 'qr') && source.publicUrlAvailable === false)
    warnings.push('Webマップが公開されていないため、QRは掲載しません。')
  if (pages.length > 1)
    warnings.push(
      `全${pages.length}ページです。すべてのページを確認してください。`,
    )
  const regions = (page: EditorialPage): EditorialRegion[] => [
    {
      slot: 'title',
      label: '見出しを編集',
      x: margin,
      y: margin,
      width: contentWidth,
      height: headerHeight,
    },
    ...(page.mapFrame
      ? [
          {
            slot: 'categoryLegend' as const,
            label: 'カテゴリー凡例',
            ...page.mapFrame,
            height: 30,
          },
        ]
      : []),
    ...page.cards.map((c) => ({
      slot: 'spotGuide' as const,
      label: `${c.number} ${c.spot.name}の紙専用紹介`,
      spotId: c.spot.id,
      ...c.rect,
    })),
    {
      slot: 'qr',
      label: 'Web案内を編集',
      x: width - margin - 220,
      y: height - margin - 60,
      width: 220,
      height: 60,
    },
  ]
  return {
    width,
    height,
    margin,
    theme,
    themeId,
    title,
    subtitle,
    intro,
    notice,
    categories,
    pages,
    numbers,
    selectedCount: selected.length,
    clippedCount,
    warnings,
    regions,
  }
}
export type EditorialDocument = ReturnType<typeof resolveEditorialDocument>
