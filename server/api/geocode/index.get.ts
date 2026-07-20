import type { GeocodeResponse } from '~~/shared/types/geocode'

export default defineEventHandler(async (event): Promise<GeocodeResponse> => {
  const query = getQuery(event).q
  const address = typeof query === 'string' ? query.trim() : ''

  if (address.length < 2 || address.length > 200) {
    throw createError({ statusCode: 422, statusMessage: '住所は2〜200文字で入力してください。' })
  }

  const configuration = useRuntimeConfig(event)
  try {
    return {
      results: await searchNominatim(address, {
        baseUrl: configuration.nominatimBaseUrl,
        userAgent: configuration.nominatimUserAgent,
      }),
    }
  }
  catch {
    throw createError({
      statusCode: 502,
      statusMessage: '住所検索サービスに接続できませんでした。時間をおいて再度お試しください。',
    })
  }
})
