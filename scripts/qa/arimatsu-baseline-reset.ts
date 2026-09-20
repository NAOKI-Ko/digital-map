import 'dotenv/config'
import { createHash, randomBytes } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import { PrismaClient } from '../../prisma/generated/client'
import { ensureDefaultSpotFieldDefinitions } from '../../server/utils/spot-field'
import {
  ARIMATSU_SPOTS,
  ARIMATSU_USERS,
  ARIMATSU_WORKSPACES,
  validatePrebackupMarker,
  validateResetEnvironment,
} from './arimatsu-baseline-lib'

const floorSpatial = {
  imageWidth: 1448,
  imageHeight: 1086,
  refAImageX: 55.47892720306513 / 1448,
  refAImageY: 36.06130268199234 / 1086,
  refALat: 35.06912258387551,
  refALng: 136.96684317481913,
  refBImageX: 1217.7624521072796 / 1448,
  refBImageY: 1056.8735632183907 / 1086,
  refBLat: 35.06355742961577,
  refBLng: 136.97447378024134,
} as const

async function main() {
  const target = validateResetEnvironment(process.env)
  const marker = JSON.parse(await readFile(target.markerPath, 'utf8'))
  validatePrebackupMarker(marker, target.databaseName)

  const connectionString = process.env.DATABASE_URL!
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  const uploadRoot = resolve(process.env.NUXT_UPLOAD_DIR || 'public/uploads')
  const publicStorageRoot = resolve(process.env.PUBLIC_STORAGE_ROOT || 'storage/public')
  const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
  const credentialPath = resolve(process.env.QA_BASELINE_CREDENTIALS_PATH || resolve(repositoryRoot, '..', `qa-baseline-credentials-${Date.now()}.txt`))
  if (credentialPath === repositoryRoot || credentialPath.startsWith(`${repositoryRoot}${sep}`)) throw new Error('Credential file must be outside Git worktree')

  const sourceAsset = resolve(repositoryRoot, 'prisma/seed-assets/arimatsu-demo/arimatsu-map.png')
  const sourceBytes = await readFile(sourceAsset)
  const sourceSha = createHash('sha256').update(sourceBytes).digest('hex')
  if (sourceSha !== 'bbcdc37460f481b959097ea68674facff617003eda5fe2eb2d418e91625f6b43') throw new Error('Approved Arimatsu illustration checksum mismatch')

  const credentials = await Promise.all(ARIMATSU_USERS.map(async user => {
    const password = randomBytes(24).toString('base64url')
    return {
      ...user,
      email: (process.env[user.emailEnv] || user.defaultEmail).trim().toLowerCase(),
      password,
      passwordHash: await hash(password, 12),
    }
  }))
  if (new Set(credentials.map(item => item.email)).size !== credentials.length) throw new Error('QA login aliases must be unique')

  await mkdir(uploadRoot, { recursive: true })
  await mkdir(publicStorageRoot, { recursive: true })
  const baselineAssetNames = ARIMATSU_WORKSPACES.map(workspace => `qa-${workspace.mapSlug}-map.png`)

  try {
    await prisma.$transaction(async transaction => {
      // TRUNCATE is intentional for this guarded QA-only reset: the production
      // append-only AuditEvent DELETE trigger correctly blocks row deletion.
      // PostgreSQL TRUNCATE ... CASCADE clears the complete QA graph without
      // weakening or dropping that generic immutability trigger.
      await transaction.$executeRawUnsafe('TRUNCATE TABLE "Tenant", "User", "MailDelivery", "RateLimitBucket", "SignupIntent", "PasswordResetToken" RESTART IDENTITY CASCADE')

      const users = new Map<string, { id: string }>()
      for (const credential of credentials) {
        const user = await transaction.user.create({ data: { email: credential.email, displayName: credential.displayName, passwordHash: credential.passwordHash, emailVerifiedAt: new Date() }, select: { id: true } })
        users.set(credential.key, user)
      }

      for (const workspace of ARIMATSU_WORKSPACES) {
        const owner = users.get(workspace.key)
        if (!owner) throw new Error(`Owner not found for ${workspace.key}`)
        const tenant = await transaction.tenant.create({ data: { name: workspace.name, slug: workspace.tenantSlug, onboardingState: 'ACTIVE' } })
        const map = await transaction.map.create({ data: {
          tenantId: tenant.id,
          name: '有松マップ',
          slug: workspace.mapSlug,
          organizationName: workspace.name,
          illustrationEnabled: true,
          realMapEnabled: false,
          defaultMapView: 'ILLUSTRATION',
          defaultLocale: 'ja',
          enabledLocales: ['ja'],
        } })
        await ensureDefaultSpotFieldDefinitions(transaction, map.id)

        for (const credential of credentials) {
          const user = users.get(credential.key)!
          await transaction.tenantMember.create({ data: { tenantId: tenant.id, userId: user.id, role: credential.key === workspace.key ? 'OWNER' : 'MEMBER' } })
          if (credential.key !== workspace.key) await transaction.mapMember.create({ data: { mapId: map.id, userId: user.id, role: 'EDITOR' } })
        }

        const storageKey = `qa-${workspace.mapSlug}-map.png`
        const asset = await transaction.mediaAsset.create({ data: {
          tenantId: tenant.id,
          storageKey,
          originalFilename: 'arimatsu-map.png',
          mimeType: 'image/png',
          width: floorSpatial.imageWidth,
          height: floorSpatial.imageHeight,
          fileSize: sourceBytes.length,
          sha256: sourceSha,
          processingStatus: 'READY',
        } })
        const floor = await transaction.mapFloor.create({ data: {
          mapId: map.id,
          name: '有松・桶狭間',
          illustrationUrl: `/uploads/${storageKey}`,
          illustrationAssetId: asset.id,
          ...floorSpatial,
        } })
        const categories = new Map<string, string>()
        for (const [order, name] of ['歴史・文化', '有松絞り', '寺社', '交通'].entries()) {
          const category = await transaction.category.create({ data: { tenantId: tenant.id, mapId: map.id, name, order, iconType: 'preset' } })
          categories.set(name, category.id)
        }
        for (const spot of ARIMATSU_SPOTS) {
          const categoryId = categories.get(spot.category)
          if (!categoryId) throw new Error(`Category not found: ${spot.category}`)
          const created = await transaction.spot.create({ data: {
            tenantId: tenant.id,
            floorId: floor.id,
            name: spot.name,
            description: spot.description,
            x: null,
            y: null,
            lat: null,
            lng: null,
            isPublished: false,
            pinIconType: 'preset',
            pinColor: '#315B49',
          } })
          await transaction.spotCategory.create({ data: { spotId: created.id, categoryId } })
        }
      }
    }, { maxWait: 10_000, timeout: 120_000 })

    for (const entry of await readdir(uploadRoot)) {
      if (entry !== '.gitkeep') await rm(resolve(uploadRoot, entry), { recursive: true, force: true })
    }
    for (const entry of await readdir(publicStorageRoot)) await rm(resolve(publicStorageRoot, entry), { recursive: true, force: true })
    for (const name of baselineAssetNames) await copyFile(sourceAsset, resolve(uploadRoot, name))
    await mkdir(dirname(credentialPath), { recursive: true })
    const credentialDocument = credentials.map(item => `${item.displayName}\t${item.email}\t${item.password}`).join('\n') + '\n'
    await writeFile(credentialPath, credentialDocument, { mode: 0o600 })
    console.info(JSON.stringify({ status: 'PASS', databaseName: target.databaseName, users: credentials.map(item => ({ displayName: item.displayName, email: item.email })), workspaces: ARIMATSU_WORKSPACES.length, maps: ARIMATSU_WORKSPACES.length, spotsPerMap: ARIMATSU_SPOTS.length, approvedAssetSha256: sourceSha, credentialsStored: true }, null, 2))
  }
  finally {
    await prisma.$disconnect()
  }
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Arimatsu baseline reset failed'); process.exitCode = 1 })
