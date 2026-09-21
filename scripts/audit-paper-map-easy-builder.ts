import 'dotenv/config'
import { Client } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is required for the read-only paper map audit.')
  process.exitCode = 2
}
else {
  const client = new Client({ connectionString: databaseUrl })
  try {
    await client.connect()
    await client.query('BEGIN TRANSACTION READ ONLY')
    const tables = (await client.query<{ paperMap: string | null, designRequest: string | null }>(`SELECT to_regclass('"PaperMap"')::text AS "paperMap", to_regclass('"PaperDesignRequest"')::text AS "designRequest"`)).rows[0]
    const statuses = (await client.query<{ enumlabel: string }>(`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE pg_type.typname = 'PaperDesignRequestStatus' ORDER BY enumsortorder`)).rows.map(row => row.enumlabel)
    const orphanPaperMaps = tables?.paperMap ? Number((await client.query(`SELECT count(*) AS count FROM "PaperMap" p LEFT JOIN "Map" m ON m.id = p."mapId" WHERE m.id IS NULL`)).rows[0]?.count ?? 0) : -1
    const invalidRequests = tables?.designRequest ? Number((await client.query(`SELECT count(*) AS count FROM "PaperDesignRequest" r LEFT JOIN "Map" m ON m.id = r."mapId" WHERE m.id IS NULL OR (r."paperMapId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "PaperMap" p WHERE p.id = r."paperMapId" AND p."mapId" = r."mapId"))`)).rows[0]?.count ?? 0) : -1
    await client.query('ROLLBACK')
    const expectedStatuses = ['REQUESTED', 'CONTACTED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED']
    const passed = Boolean(tables?.paperMap && tables.designRequest && JSON.stringify(statuses) === JSON.stringify(expectedStatuses) && orphanPaperMaps === 0 && invalidRequests === 0)
    console.log(JSON.stringify({ tables, statuses, orphanPaperMaps, invalidRequests, status: passed ? 'PASS' : 'FAIL' }, null, 2))
    if (!passed) process.exitCode = 1
  }
  catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    console.error('Paper map Easy Builder audit could not complete.', error)
    process.exitCode = 2
  }
  finally { await client.end().catch(() => undefined) }
}
