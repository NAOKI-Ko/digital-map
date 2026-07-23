import { getPinIconPreset } from '~~/shared/constants/spot'
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

  return {
    type,
    color: colors.base,
    lightColor: colors.light,
    darkColor: colors.dark,
    imageUrl: type === 'preset' ? null : spot.pinIconImageUrl,
    symbol: type === 'preset'
      ? getPinIconPreset(spot.pinIconId, spot.category).symbol
      : null,
  }
}

export interface CreateSpotMarkerElementOptions {
  mode: 'view' | 'edit'
  selected: boolean
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
  element.classList.toggle('map-viewer-marker--selected', options.selected)
  element.style.setProperty('--pin-color', presentation.color)
  element.style.setProperty('--pin-color-light', presentation.lightColor)
  element.style.setProperty('--pin-color-dark', presentation.darkColor)
  element.setAttribute('aria-label', options.mode === 'edit'
    ? `${spot.name}をドラッグして位置調整`
    : `${spot.name}の詳細を表示`)
  element.title = spot.name

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
    if (presentation.type === 'custom' && presentation.imageUrl) {
      const image = ownerDocument.createElement('img')
      image.className = 'map-viewer-marker__content'
      image.src = presentation.imageUrl
      image.alt = ''
      shape.append(image)
    }
    else {
      const content = ownerDocument.createElement('span')
      content.className = 'map-viewer-marker__content'
      content.textContent = presentation.symbol
      shape.append(content)
    }
    element.append(shape)
  }

  element.addEventListener('click', (event) => {
    event.stopPropagation()
    options.onSelected?.()
  })

  return element
}
