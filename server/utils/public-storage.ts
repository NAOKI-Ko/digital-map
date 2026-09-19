import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import { dirname, resolve, sep } from 'node:path'

export interface PublicObject {
  bytes: Uint8Array
  contentType: string
  cacheControl: string
  etag?: string
}

export interface PublicObjectStorage {
  put(key: string, value: Uint8Array | string, options: PublicWriteOptions): Promise<PublicWriteResult>
  get(key: string): Promise<PublicObject | null>
}

export interface PublicWriteOptions {
  contentType: string
  cacheControl: string
  ifMatchEtag?: string
  ifNoneMatch?: boolean
}

export interface PublicWriteResult { etag?: string }

export const immutableCacheControl = 'public, max-age=31536000, immutable'
export const pointerCacheControl = 'no-cache, max-age=0, must-revalidate'

export function safePublicKey(key: string) {
  if (!/^[0-9A-Za-z][0-9A-Za-z._/-]*$/.test(key) || key.includes('..') || key.startsWith('/')) throw new Error('Invalid public object key')
  return key
}

export class LocalPublicStorage implements PublicObjectStorage {
  constructor(private readonly root: string) {}

  private paths(key: string) {
    safePublicKey(key)
    const data = resolve(this.root, key)
    if (!data.startsWith(resolve(this.root) + sep)) throw new Error('Public object escaped storage root')
    return { data, metadata: `${data}.metadata.json` }
  }

  async put(key: string, value: Uint8Array | string, options: PublicWriteOptions) {
    const paths = this.paths(key)
    await mkdir(dirname(paths.data), { recursive: true })
    const nextBytes = Buffer.from(value)
    const existing = await readFile(paths.data).catch(() => null)
    const existingEtag = existing ? createHash('sha256').update(existing).digest('hex') : undefined
    if (options.ifNoneMatch && existing) throw new Error('PUBLIC_OBJECT_PRECONDITION_FAILED')
    if (options.ifMatchEtag && existingEtag !== options.ifMatchEtag) throw new Error('PUBLIC_OBJECT_PRECONDITION_FAILED')
    if (options.cacheControl.includes('immutable')) {
      if (existing) {
        if (existing.equals(nextBytes)) return { etag: existingEtag }
        throw new Error('IMMUTABLE_PUBLIC_OBJECT_EXISTS')
      }
    }
    const etag = createHash('sha256').update(nextBytes).digest('hex')
    await writeFile(paths.data, nextBytes)
    await writeFile(paths.metadata, JSON.stringify({ contentType: options.contentType, cacheControl: options.cacheControl, etag }))
    return { etag }
  }

  async get(key: string): Promise<PublicObject | null> {
    const paths = this.paths(key)
    try {
      const [bytes, metadata] = await Promise.all([readFile(paths.data), readFile(paths.metadata, 'utf8').then(JSON.parse)])
      return { bytes, contentType: metadata.contentType, cacheControl: metadata.cacheControl, etag: metadata.etag ?? createHash('sha256').update(bytes).digest('hex') } satisfies PublicObject
    }
    catch { return null }
  }
}

export class S3PublicStorage implements PublicObjectStorage {
  private readonly client: S3Client
  constructor(private readonly bucket: string, config: { endpoint: string, region: string, accessKeyId: string, secretAccessKey: string }) {
    this.client = new S3Client({ endpoint: config.endpoint, region: config.region, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } })
  }

  async put(key: string, value: Uint8Array | string, options: PublicWriteOptions) {
    try {
      const result = await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: safePublicKey(key),
        Body: value,
        ContentType: options.contentType,
        CacheControl: options.cacheControl,
        IfMatch: options.ifMatchEtag,
        IfNoneMatch: (options.ifNoneMatch || options.cacheControl.includes('immutable')) ? '*' : undefined,
      }))
      return { etag: result.ETag }
    }
    catch (error: any) {
      if (error?.name === 'PreconditionFailed' || error?.$metadata?.httpStatusCode === 412) {
        throw new Error('PUBLIC_OBJECT_PRECONDITION_FAILED')
      }
      throw error
    }
  }

  async get(key: string): Promise<PublicObject | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: safePublicKey(key) }))
      if (!result.Body) return null
      return { bytes: await result.Body.transformToByteArray(), contentType: result.ContentType ?? 'application/octet-stream', cacheControl: result.CacheControl ?? pointerCacheControl, etag: result.ETag }
    }
    catch (error: any) {
      if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) return null
      throw error
    }
  }
}

export function getPublicStorage() {
  const driver = process.env.PUBLIC_STORAGE_DRIVER || (process.env.NODE_ENV === 'production' ? 'r2' : 'local')
  if (driver === 'local') return new LocalPublicStorage(resolve(process.env.PUBLIC_STORAGE_ROOT || './storage/public'))
  if (driver !== 'r2') throw new Error('Unsupported PUBLIC_STORAGE_DRIVER')
  const endpoint = process.env.R2_ENDPOINT
  const bucket = process.env.R2_BUCKET
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) throw new Error('R2 public storage is not configured')
  return new S3PublicStorage(bucket, { endpoint, region: process.env.R2_REGION || 'auto', accessKeyId, secretAccessKey })
}
