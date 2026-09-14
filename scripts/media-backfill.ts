import 'dotenv/config'
import { resolve } from 'node:path'
import { processMediaAsset } from '../server/utils/media-variants'
import { prisma } from '../server/utils/prisma'

const uploadDirectory = resolve(process.env.NUXT_UPLOAD_DIR || './public/uploads')
const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: 'asc' } })
let ready = 0
let failed = 0
for (const asset of assets) {
  const result = await processMediaAsset(prisma, asset, uploadDirectory)
  if (result.status === 'READY') ready += 1
  else failed += 1
}
console.info(JSON.stringify({ scanned: assets.length, ready, failed }))
await prisma.$disconnect()
if (failed) process.exitCode = 1
