const DEFAULT_PIN_COLOR = '#C7401F'
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

function mixChannel(base: number, target: number, targetRatio: number) {
  return Math.round(base * (1 - targetRatio) + target * targetRatio)
}

function toHexChannel(value: number) {
  return value.toString(16).padStart(2, '0')
}

/**
 * CSS color-mix()に依存せず、sRGB上で白または黒を混ぜた色を算出する。
 */
export function mixHexColor(
  color: string,
  target: 'white' | 'black',
  targetRatio = 0.4,
) {
  const normalized = HEX_COLOR_PATTERN.test(color) ? color.toUpperCase() : DEFAULT_PIN_COLOR
  const ratio = Math.min(1, Math.max(0, targetRatio))
  const targetChannel = target === 'white' ? 255 : 0
  const channels = [1, 3, 5].map(index => Number.parseInt(normalized.slice(index, index + 2), 16))
  const [red = 0, green = 0, blue = 0] = channels

  return `#${[
    mixChannel(red, targetChannel, ratio),
    mixChannel(green, targetChannel, ratio),
    mixChannel(blue, targetChannel, ratio),
  ].map(toHexChannel).join('')}`.toUpperCase()
}

export function getPinColorVariants(color: string) {
  const base = HEX_COLOR_PATTERN.test(color) ? color.toUpperCase() : DEFAULT_PIN_COLOR
  return {
    base,
    light: mixHexColor(base, 'white'),
    dark: mixHexColor(base, 'black'),
  }
}
