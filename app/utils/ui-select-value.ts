const EMPTY_SELECT_VALUE = '__digital_map_empty__'

export function toSelectValue(value: string) {
  return value === '' ? EMPTY_SELECT_VALUE : value
}

export function fromSelectValue(value: unknown) {
  const normalized = String(value)
  return normalized === EMPTY_SELECT_VALUE ? '' : normalized
}
