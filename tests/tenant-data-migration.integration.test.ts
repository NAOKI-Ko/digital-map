import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { Client } from 'pg'
import { describe, expect, it } from 'vitest'

const databaseUrl = process.env.DATABASE_URL
const integration = databaseUrl ? describe : describe.skip
const migration = await readFile(
  new URL('../prisma/migrations/20260920010000_tenant_data_foundation/migration.sql', import.meta.url),
  'utf8',
)
const mapUniquenessMigration = await readFile(
  new URL('../prisma/migrations/20260920020000_map_tenant_unique/migration.sql', import.meta.url),
  'utf8',
)

async function withPreWu49Schema(run: (client: Client) => Promise<void>) {
  const schema = `wu49_migration_${randomUUID().replaceAll('-', '')}`
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    await client.query(`CREATE SCHEMA "${schema}"`)
    await client.query(`SET search_path TO "${schema}"`)
    await client.query(`
      CREATE TABLE "Tenant" (id TEXT PRIMARY KEY);
      CREATE TABLE "Map" (
        id TEXT PRIMARY KEY,
        "tenantId" TEXT NOT NULL REFERENCES "Tenant"(id)
      );
      CREATE INDEX "Map_tenantId_idx" ON "Map"("tenantId");
      CREATE TABLE "MapFloor" (
        id TEXT PRIMARY KEY,
        "mapId" TEXT NOT NULL REFERENCES "Map"(id)
      );
      CREATE TABLE "Spot" (
        id TEXT PRIMARY KEY,
        "floorId" TEXT NOT NULL
      );
      CREATE TABLE "Category" (
        id TEXT PRIMARY KEY,
        "mapId" TEXT NOT NULL,
        name TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0
      );
      CREATE UNIQUE INDEX "Category_mapId_name_key" ON "Category"("mapId", name);
    `)
    await run(client)
  }
  finally {
    await client.query('SET search_path TO public').catch(() => undefined)
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`).catch(() => undefined)
    await client.end()
  }
}

integration('WU-49 upgrade migration', () => {
  it('backfills unambiguous Spot/Category ownership and Illustration defaults', async () => {
    await withPreWu49Schema(async (client) => {
      await client.query(`
        INSERT INTO "Tenant" (id) VALUES ('tenant-a');
        INSERT INTO "Map" (id, "tenantId") VALUES ('map-a', 'tenant-a');
        INSERT INTO "MapFloor" (id, "mapId") VALUES ('floor-a', 'map-a');
        INSERT INTO "Spot" (id, "floorId") VALUES ('spot-a', 'floor-a');
        INSERT INTO "Category" (id, "mapId", name) VALUES ('category-a', 'map-a', '観光');
      `)
      await client.query(migration)
      expect((await client.query('SELECT "tenantId", lat, lng FROM "Spot" WHERE id = \'spot-a\'')).rows[0]).toEqual({
        tenantId: 'tenant-a',
        lat: null,
        lng: null,
      })
      expect((await client.query('SELECT "tenantId" FROM "Category" WHERE id = \'category-a\'')).rows[0]).toEqual({ tenantId: 'tenant-a' })
      expect((await client.query('SELECT "illustrationEnabled", "realMapEnabled", "defaultMapView" FROM "Map" WHERE id = \'map-a\'')).rows[0]).toEqual({
        illustrationEnabled: true,
        realMapEnabled: false,
        defaultMapView: 'ILLUSTRATION',
      })
    })
  })

  it('fails loudly when a Spot cannot derive a Tenant', async () => {
    await withPreWu49Schema(async (client) => {
      await client.query(`
        INSERT INTO "Tenant" (id) VALUES ('tenant-a');
        INSERT INTO "Map" (id, "tenantId") VALUES ('map-a', 'tenant-a');
        INSERT INTO "Spot" (id, "floorId") VALUES ('orphan-spot', 'missing-floor');
      `)
      await expect(client.query(migration)).rejects.toThrow(/tenant backfill left unresolved rows/)
    })
  })

  it('fails before mutation when tenant-scoped Category names collide', async () => {
    await withPreWu49Schema(async (client) => {
      await client.query(`
        INSERT INTO "Tenant" (id) VALUES ('tenant-a');
        INSERT INTO "Map" (id, "tenantId") VALUES ('map-a', 'tenant-a'), ('map-b', 'tenant-a');
        INSERT INTO "Category" (id, "mapId", name) VALUES
          ('category-a', 'map-a', '観光'),
          ('category-b', 'map-b', '観光');
      `)
      await expect(client.query(migration)).rejects.toThrow(/duplicate names exist/)
      expect((await client.query(`
        SELECT count(*)::int AS count
        FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'Spot' AND column_name = 'tenantId'
      `)).rows[0]?.count).toBe(0)
    })
  })

  it('enforces at most one Map per Tenant while allowing an onboarding Tenant with zero Maps', async () => {
    await withPreWu49Schema(async (client) => {
      await client.query(`
        INSERT INTO "Tenant" (id) VALUES ('tenant-a'), ('tenant-onboarding');
        INSERT INTO "Map" (id, "tenantId") VALUES ('map-a', 'tenant-a');
      `)
      await client.query(migration)
      await client.query(mapUniquenessMigration)
      await expect(client.query(`INSERT INTO "Map" (id, "tenantId") VALUES ('map-b', 'tenant-a')`)).rejects.toThrow(/duplicate key/)
      expect((await client.query(`SELECT count(*)::int AS count FROM "Map" WHERE "tenantId"='tenant-onboarding'`)).rows[0]?.count).toBe(0)
    })
  })

  it('refuses hard 1:1 activation when a Tenant still owns multiple Maps', async () => {
    await withPreWu49Schema(async (client) => {
      await client.query(`
        INSERT INTO "Tenant" (id) VALUES ('tenant-a');
        INSERT INTO "Map" (id, "tenantId") VALUES ('map-a', 'tenant-a'), ('map-b', 'tenant-a');
      `)
      await client.query(migration)
      await expect(client.query(mapUniquenessMigration)).rejects.toThrow(/duplicate tenantId values exist/)
      expect((await client.query(`
        SELECT count(*)::int AS count
        FROM pg_indexes
        WHERE schemaname=current_schema() AND indexname='Map_tenantId_key'
      `)).rows[0]?.count).toBe(0)
    })
  })
})
