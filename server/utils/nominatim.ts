import type { GeocodeResult } from '~~/shared/types/geocode'

interface NominatimRow {
  place_id?: number
  osm_type?: string
  osm_id?: number
  display_name?: string
  lat?: string
  lon?: string
  category?: string
  type?: string
}

const cache = new Map<string, { expiresAt: number, results: GeocodeResult[] }>()
let requestQueue: Promise<void> = Promise.resolve()
let lastRequestAt = 0

export async function searchNominatim(query: string, configuration: { baseUrl: string, userAgent: string }) {
  const cacheKey = query.toLocaleLowerCase('ja-JP')
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results
  }

  const results = await scheduleRequest(async () => {
    const url = new URL('/search', configuration.baseUrl)
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '5')

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'ja',
        'User-Agent': configuration.userAgent,
      },
      signal: AbortSignal.timeout(8_000),
    })

    if (!response.ok) {
      throw new Error(`Nominatim responded with ${response.status}`)
    }

    const rows = await response.json() as NominatimRow[]
    return rows.flatMap((row) => {
      const lat = Number(row.lat)
      const lng = Number(row.lon)
      if (!row.display_name || !Number.isFinite(lat) || !Number.isFinite(lng)) return []

      return [{
        id: row.osm_type && row.osm_id ? `${row.osm_type}-${row.osm_id}` : `place-${row.place_id ?? `${lat}-${lng}`}`,
        displayName: row.display_name,
        lat,
        lng,
        category: row.category ?? null,
        type: row.type ?? null,
      }]
    })
  })

  cache.set(cacheKey, { expiresAt: Date.now() + 24 * 60 * 60 * 1000, results })
  return results
}

async function scheduleRequest<T>(request: () => Promise<T>) {
  let resolveResult: (value: T) => void
  let rejectResult: (reason?: unknown) => void
  const result = new Promise<T>((resolve, reject) => {
    resolveResult = resolve
    rejectResult = reject
  })

  requestQueue = requestQueue.then(async () => {
    const waitMilliseconds = Math.max(0, 1_000 - (Date.now() - lastRequestAt))
    if (waitMilliseconds > 0) {
      await new Promise(resolve => setTimeout(resolve, waitMilliseconds))
    }
    lastRequestAt = Date.now()

    try {
      resolveResult(await request())
    }
    catch (error) {
      rejectResult(error)
    }
  })

  return result
}
