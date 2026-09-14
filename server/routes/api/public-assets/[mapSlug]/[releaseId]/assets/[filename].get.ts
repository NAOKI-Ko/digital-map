import { releaseRoot } from '~~/server/utils/public-release'
import { getPublicStorage } from '~~/server/utils/public-storage'

export default defineEventHandler(async (event) => {
  const mapSlug = getRouterParam(event, 'mapSlug') ?? ''
  const releaseId = getRouterParam(event, 'releaseId') ?? ''
  const filename = getRouterParam(event, 'filename') ?? ''
  if (!/^[a-z0-9-]+$/i.test(mapSlug) || !/^[a-z0-9]+$/i.test(releaseId) || !/^[a-f0-9]{64}\.(?:png|jpg|webp)$/i.test(filename)) throw createError({ statusCode: 404 })
  const object = await getPublicStorage().get(`${releaseRoot(mapSlug, releaseId)}/assets/${filename}`)
  if (!object) throw createError({ statusCode: 404 })
  setHeader(event, 'Content-Type', object.contentType)
  setHeader(event, 'Cache-Control', object.cacheControl)
  if (object.etag) setHeader(event, 'ETag', object.etag)
  return object.bytes
})
