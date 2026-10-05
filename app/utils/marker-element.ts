import { bindVisitorMarkerInteraction } from './marker-interaction'
import { getPinIconPreset, isFacilityPinIcon } from '~~/shared/constants/spot'
import type { MapViewerSpot } from '~~/shared/types/map-viewer'
import { getPinColorVariants } from '~~/shared/utils/pin-style'

export function getSpotMarkerPresentation(spot: MapViewerSpot) {
  const colors = getPinColorVariants(spot.pinColor)
  const hasImage = Boolean(spot.pinIconImageUrl)
  const type = spot.pinIconType === 'illustration' && hasImage
    ? 'illustration'
    : spot.pinIconType === 'custom' && hasImage
      ? 'custom'
      : 'preset'
  const preset = type === 'preset'
    ? getPinIconPreset(spot.pinIconId)
    : null

  return {
    type,
    color: colors.base,
    lightColor: colors.light,
    darkColor: colors.dark,
    imageUrl: type === 'preset' ? null : spot.pinIconImageUrl,
    iconFamily: preset?.family ?? null,
    symbol: preset?.symbol ?? null,
    text: preset?.text ?? null,
    facility: isFacilityPinIcon(spot),
    facilityImageUrl: isFacilityPinIcon(spot) ? preset?.imageUrl ?? null : null,
  }
}

/** Reused when collision recovery changes the action, so equipment meaning survives. */
export function getSpotMarkerAccessibleName(spot: MapViewerSpot) {
  return isFacilityPinIcon(spot)
    ? `${spot.name}（設備・${getPinIconPreset(spot.pinIconId).label}）`
    : spot.name
}

export function getSpotMarkerVisitorLabel(spot: MapViewerSpot, collisionCount = 1, includeCount = true) {
  const name = getSpotMarkerAccessibleName(spot)
  return collisionCount > 1
    ? `${name}の周辺ピンを表示${includeCount ? `（${collisionCount}件）` : ''}`
    : `${name}の詳細を表示`
}

export interface CreateSpotMarkerElementOptions {
  mode: 'view' | 'edit'
  visitor?: boolean
  selected: boolean
  draggable?: boolean
  dimmed?: boolean
  stronglyDimmed?: boolean
  ghost?: boolean
  candidate?: 'placement' | 'move' | null
  onSelected?: () => void
}

type MarkerDocument = Pick<Document, 'createElement'>

export function createSpotMarkerElement(
  spot: MapViewerSpot,
  options: CreateSpotMarkerElementOptions,
  ownerDocument: MarkerDocument = document,
) {
  const presentation = getSpotMarkerPresentation(spot)
  const element = ownerDocument.createElement('button')
  element.type = 'button'
  element.className = 'map-viewer-marker'
  element.classList.toggle('map-viewer-marker--illustration', presentation.type === 'illustration')
  element.classList.toggle('map-viewer-marker--facility', presentation.facility)
  element.classList.toggle('map-viewer-marker--selected', options.selected)
  element.classList.toggle('map-viewer-marker--featured', spot.importance === 'featured')
  element.classList.toggle('map-viewer-marker--dimmed', Boolean(options.dimmed))
  element.classList.toggle('map-viewer-marker--strongly-dimmed', Boolean(options.stronglyDimmed))
  element.classList.toggle('map-viewer-marker--ghost', Boolean(options.ghost))
  element.classList.toggle('map-viewer-marker--candidate', Boolean(options.candidate))
  element.classList.toggle('map-viewer-marker--move-candidate', options.candidate === 'move')
  element.setAttribute('data-spot-importance', spot.importance)
  element.setAttribute('data-spot-id', spot.id)
  element.setAttribute('data-marker-contact', 'bottom-center')
  element.style.setProperty('--pin-color', presentation.color)
  element.style.setProperty('--pin-color-light', presentation.lightColor)
  element.style.setProperty('--pin-color-dark', presentation.darkColor)
  const candidateLabel = options.candidate === 'move' ? '移動先' : '仮配置'
  const accessibleName = getSpotMarkerAccessibleName(spot)
  element.setAttribute('aria-label', options.candidate
    ? `${accessibleName}の${candidateLabel}ピンをドラッグして位置調整`
    : options.ghost
      ? `${accessibleName}の元の位置`
      : options.mode === 'edit'
        ? options.draggable
          ? `${accessibleName}をドラッグして位置調整`
          : `${accessibleName}を選択`
        : getSpotMarkerVisitorLabel(spot))
  element.title = spot.name

  if (options.candidate) {
    const badge = ownerDocument.createElement('span')
    badge.className = 'map-viewer-marker__candidate-badge'
    badge.textContent = candidateLabel
    element.append(badge)
  }

  const groundShadow = ownerDocument.createElement('span')
  groundShadow.className = 'map-viewer-marker__ground-shadow'
  groundShadow.setAttribute('aria-hidden', 'true')
  element.append(groundShadow)

  if (presentation.type === 'illustration' && presentation.imageUrl) {
    const illustration = ownerDocument.createElement('span')
    illustration.className = 'map-viewer-marker__illustration'
    const image = ownerDocument.createElement('img')
    image.className = 'map-viewer-marker__illustration-image'
    image.src = presentation.imageUrl
    image.alt = ''
    illustration.append(image)
    element.append(illustration)
  }
  else {
    const shape = ownerDocument.createElement('span')
    shape.className = 'map-viewer-marker__shape'
    if (presentation.facility && presentation.facilityImageUrl) {
      const image = ownerDocument.createElement('img')
      image.className = 'map-viewer-marker__content map-viewer-marker__content--facility'
      image.src = presentation.facilityImageUrl
      image.alt = ''
      image.setAttribute('aria-hidden', 'true')
      shape.append(image)
    }
    else if (presentation.type === 'custom' && presentation.imageUrl) {
      const image = ownerDocument.createElement('img')
      image.className = 'map-viewer-marker__content'
      image.src = presentation.imageUrl
      image.alt = ''
      shape.append(image)
    }
    else {
      const content = ownerDocument.createElement('span')
      content.className = presentation.iconFamily === 'material'
        ? 'map-viewer-marker__content map-viewer-marker__content--material material-symbols-outlined'
        : 'map-viewer-marker__content'
      content.textContent = presentation.symbol
      content.setAttribute('aria-hidden', 'true')
      shape.append(content)
    }
    if (presentation.facility && presentation.text) {
      shape.classList.toggle('map-viewer-marker__shape--with-text', true)
      const text = ownerDocument.createElement('span')
      text.className = 'map-viewer-marker__facility-text'
      text.textContent = presentation.text
      text.setAttribute('aria-hidden', 'true')
      shape.append(text)
    }
    element.append(shape)
  }

  if (options.mode === 'view' && options.visitor) {
    if (spot.importance === 'featured') {
      const decoration = ownerDocument.createElement('span')
      decoration.className = 'map-viewer-marker__featured'
      decoration.setAttribute('aria-hidden', 'true')
      element.append(decoration)
    }
    const badge = ownerDocument.createElement('span')
    badge.className = 'map-viewer-marker__collision-badge'
    badge.hidden = true
    badge.setAttribute('aria-hidden', 'true')
    element.append(badge)
    const name = ownerDocument.createElement('span')
    name.className = 'map-viewer-marker__name'
    name.setAttribute('aria-hidden', 'true')
    name.textContent = spot.name
    element.append(name)
  }

  if (options.mode === 'view' && options.visitor) bindVisitorMarkerInteraction(element, () => options.onSelected?.())
  else element.addEventListener('click', (event) => {
    event.stopPropagation()
    options.onSelected?.()
  })

  return element
}
