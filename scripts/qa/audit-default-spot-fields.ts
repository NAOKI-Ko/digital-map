import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/client'
import { inspectDefaultSpotFieldInvariant } from '../../server/utils/spot-field'

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  try {
    const maps = await prisma.map.findMany({
      orderBy: { slug: 'asc' },
      select: { slug: true, spotFieldDefinitions: { orderBy: [{ order: 'asc' }, { id: 'asc' }], select: { kind: true, semanticKey: true } } },
    })
    const results = maps.map((map) => {
      const invariant = inspectDefaultSpotFieldInvariant(map.spotFieldDefinitions)
      return {
        slug: map.slug,
        totalFieldCount: map.spotFieldDefinitions.length,
        standardSemanticKeys: map.spotFieldDefinitions.filter(field => field.kind === 'standard').map(field => field.semanticKey),
        customCount: map.spotFieldDefinitions.filter(field => field.kind === 'custom').length,
        ...invariant,
      }
    })
    const failures = results.filter(result => !result.valid)
    console.info(JSON.stringify({ status: failures.length ? 'FAIL' : 'PASS', maps: results }, null, 2))
    if (failures.length) process.exitCode = 1
  }
  finally { await prisma.$disconnect() }
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Default Spot Field audit failed'); process.exitCode = 2 })
