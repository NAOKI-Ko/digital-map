import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/client'
import { ensureDefaultSpotFieldDefinitions } from '../../server/utils/spot-field'

const confirmation = 'I_UNDERSTAND_THIS_ADDS_MISSING_DEFAULT_FIELDS'

async function main() {
  const environment = process.env.QA_SPOT_FIELD_REPAIR_ENV
  if (environment !== 'local' && environment !== 'windows-qa') throw new Error('QA_SPOT_FIELD_REPAIR_ENV must be local or windows-qa')
  if (process.env.ALLOW_SPOT_FIELD_REPAIR !== confirmation) throw new Error('Missing exact Spot Field repair confirmation token')
  if (process.env.DEPLOYMENT_ENV === 'production') throw new Error('Production Spot Field repair is refused')
  if (environment === 'windows-qa' && process.env.DEPLOYMENT_ENV !== 'qa') throw new Error('windows-qa repair requires DEPLOYMENT_ENV=qa')
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  try {
    const maps = await prisma.map.findMany({ select: { id: true, slug: true }, orderBy: { slug: 'asc' } })
    const results = []
    for (const map of maps) {
      const result = await prisma.$transaction(transaction => ensureDefaultSpotFieldDefinitions(transaction, map.id))
      results.push({ slug: map.slug, ...result })
    }
    console.info(JSON.stringify({ status: 'PASS', environment, maps: results }, null, 2))
  }
  finally { await prisma.$disconnect() }
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Default Spot Field repair failed'); process.exitCode = 1 })
