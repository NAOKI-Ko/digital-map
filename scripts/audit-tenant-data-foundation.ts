import 'dotenv/config'
import { Client } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is required for the read-only tenant data foundation audit.')
  process.exitCode = 2
}
else {
  const client = new Client({ connectionString: databaseUrl })
  try {
    await client.connect()
    await client.query('BEGIN TRANSACTION READ ONLY')

    const queries = {
      spotsWithoutTenant: 'SELECT id FROM "Spot" WHERE "tenantId" IS NULL ORDER BY id',
      categoriesWithoutTenant: 'SELECT id FROM "Category" WHERE "tenantId" IS NULL ORDER BY id',
      spotFloorTenantMismatch: `
        SELECT s.id, s."tenantId" AS "spotTenantId", m."tenantId" AS "mapTenantId"
        FROM "Spot" s
        JOIN "MapFloor" f ON f.id = s."floorId"
        JOIN "Map" m ON m.id = f."mapId"
        WHERE s."tenantId" <> m."tenantId"
        ORDER BY s.id
      `,
      categoryMapTenantMismatch: `
        SELECT c.id, c."tenantId" AS "categoryTenantId", m."tenantId" AS "mapTenantId"
        FROM "Category" c
        JOIN "Map" m ON m.id = c."mapId"
        WHERE c."tenantId" <> m."tenantId"
        ORDER BY c.id
      `,
      spotCategoryTenantMismatch: `
        SELECT sc."spotId", sc."categoryId", s."tenantId" AS "spotTenantId", c."tenantId" AS "categoryTenantId"
        FROM "SpotCategory" sc
        JOIN "Spot" s ON s.id = sc."spotId"
        JOIN "Category" c ON c.id = sc."categoryId"
        WHERE s."tenantId" <> c."tenantId"
        ORDER BY sc."spotId", sc."categoryId"
      `,
      invalidRealCoordinates: `
        SELECT id, lat, lng
        FROM "Spot"
        WHERE (lat IS NULL) <> (lng IS NULL)
          OR lat < -90 OR lat > 90
          OR lng < -180 OR lng > 180
          OR lat = 'NaN'::double precision OR lng = 'NaN'::double precision
        ORDER BY id
      `,
      multiMapTenants: `
        SELECT t.id, t.slug, count(m.id)::int AS "mapCount", array_agg(m.id ORDER BY m.id) AS "mapIds"
        FROM "Tenant" t
        JOIN "Map" m ON m."tenantId" = t.id
        GROUP BY t.id, t.slug
        HAVING count(m.id) > 1
        ORDER BY t.id
      `,
      invalidMapViews: `
        SELECT id, "illustrationEnabled", "realMapEnabled", "defaultMapView"
        FROM "Map"
        WHERE NOT ("illustrationEnabled" OR "realMapEnabled")
          OR ("defaultMapView" = 'ILLUSTRATION' AND NOT "illustrationEnabled")
          OR ("defaultMapView" = 'REAL' AND NOT "realMapEnabled")
        ORDER BY id
      `,
      partialImageCoordinates: 'SELECT id, "floorId", x, y FROM "Spot" WHERE (x IS NULL) <> (y IS NULL) ORDER BY id',
      outsideImageCoordinates: 'SELECT id, "floorId", x, y FROM "Spot" WHERE x < 0 OR x > 1 OR y < 0 OR y > 1 ORDER BY id',
    } as const

    const anomalyEntries: Array<[string, Array<Record<string, unknown>>]> = []
    for (const [name, sql] of Object.entries(queries)) {
      anomalyEntries.push([name, (await client.query(sql)).rows])
    }
    const anomalies = Object.fromEntries(anomalyEntries) as Record<keyof typeof queries, Array<Record<string, unknown>>>
    const counts = {
      tenants: Number((await client.query('SELECT count(*) AS count FROM "Tenant"')).rows[0]?.count ?? 0),
      maps: Number((await client.query('SELECT count(*) AS count FROM "Map"')).rows[0]?.count ?? 0),
      spots: Number((await client.query('SELECT count(*) AS count FROM "Spot"')).rows[0]?.count ?? 0),
      categories: Number((await client.query('SELECT count(*) AS count FROM "Category"')).rows[0]?.count ?? 0),
      spotCategories: Number((await client.query('SELECT count(*) AS count FROM "SpotCategory"')).rows[0]?.count ?? 0),
    }
    await client.query('ROLLBACK')

    const stagedOneMapBlockers = anomalies.multiMapTenants
    const hardAnomalies = Object.entries(anomalies)
      .filter(([name]) => name !== 'multiMapTenants')
      .reduce((sum, [, rows]) => sum + rows.length, 0)

    console.log(JSON.stringify({
      counts,
      anomalies,
      policy: {
        hardOneTenantOneMapClaimed: false,
        stagedOneMapBlockerCount: stagedOneMapBlockers.length,
      },
    }, null, 2))

    if (hardAnomalies > 0) {
      console.error('Tenant data foundation audit failed with ' + hardAnomalies + ' integrity anomaly/anomalies.')
      process.exitCode = 1
    }
    else {
      console.log('Tenant data foundation audit passed; ' + stagedOneMapBlockers.length + ' staged one-Map blocker(s) remain explicitly reported.')
    }
  }
  catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    console.error('Tenant data foundation audit could not complete.', error)
    process.exitCode = 2
  }
  finally {
    await client.end().catch(() => undefined)
  }
}
