const spotListKeys = new Set(['q', 'categoryId', 'floorId', 'status', 'position', 'sort'])
const statusValues = new Set(['published', 'draft'])
const positionValues = new Set(['positioned', 'unpositioned'])
const sortValues = new Set(['updated', 'name', 'created'])

export function resolveSpotListReturnTo(mapId: string, value: unknown) {
  const parent = `/admin/maps/${mapId}/spots`
  if (typeof value !== 'string' || !value.startsWith(parent) || value.startsWith('//')) return parent

  try {
    const url = new URL(value, 'http://local.invalid')
    if (url.origin !== 'http://local.invalid' || url.pathname !== parent || url.hash) return parent
    const query = new URLSearchParams()
    for (const [key, entry] of url.searchParams) {
      if (!spotListKeys.has(key) || query.has(key) || entry.length > 100) return parent
      if (key === 'status' && entry && !statusValues.has(entry)) return parent
      if (key === 'position' && entry && !positionValues.has(entry)) return parent
      if (key === 'sort' && entry && !sortValues.has(entry)) return parent
      if ((key === 'categoryId' || key === 'floorId') && entry && !/^[\w-]+$/.test(entry)) return parent
      query.set(key, entry)
    }
    return query.size ? `${parent}?${query.toString()}` : parent
  }
  catch { return parent }
}
