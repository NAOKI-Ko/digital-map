import { randomUUID } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { Client } from 'pg'
import { describe, expect, it } from 'vitest'

const databaseUrl = process.env.DATABASE_URL
const integration = databaseUrl ? describe : describe.skip
const root = new URL('../prisma/migrations/', import.meta.url)
async function upgrade(run: (client: Client, migrate: () => Promise<void>) => Promise<void>) {
  if (!databaseUrl || !/digital_map_(?:test_|ci)/.test(new URL(databaseUrl).pathname)) throw new Error('Disposable database required')
  const schema = `wu72_${randomUUID().replaceAll('-', '')}`
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    await client.query(`CREATE SCHEMA "${schema}"; SET search_path TO "${schema}"`)
    const migrations = (await readdir(root)).filter(name => /^\d/.test(name)).sort()
    for (const name of migrations.filter(name => name < '20261004')) await client.query(await readFile(new URL(`${name}/migration.sql`, root), 'utf8'))
    await client.query(`
      INSERT INTO "Tenant" (id,name,slug,"updatedAt") VALUES ('t','Workspace','wu72',now());
      INSERT INTO "Map" (id,"tenantId",name,slug,"updatedAt") VALUES ('m','t','Map','wu72',now());
      INSERT INTO "MapFloor" (id,"mapId",name,"illustrationUrl","imageWidth","imageHeight","updatedAt") VALUES ('f','m','Floor','/uploads/test.png',100,100,now()),('f2','m','Floor2','/uploads/test.png',100,100,now());
      INSERT INTO "Spot" (id,"tenantId","floorId",name,x,y,"isPublished","liveVersion","updatedAt") VALUES ('positioned','t','f','Content',.2,.3,true,7,now()),('unplaced','t','f','Draft',null,null,false,3,now());
    `)
    // Exercise references absent from the current Windows fixture (pending revisions,
    // editor assignments and custom values) before any WU72 migration is applied.
    await client.query(`
      INSERT INTO "User" (id,email,"passwordHash","updatedAt") VALUES ('editor','wu72-upgrade@example.invalid','fixture-only',now());
      INSERT INTO "TenantMember" (id,"tenantId","userId",role,"updatedAt") VALUES ('member','t','editor','MEMBER',now());
      INSERT INTO "Category" (id,"tenantId","mapId",name,"updatedAt") VALUES ('cat','t','m','Canonical taxonomy',now());
      INSERT INTO "CategoryTranslation" (id,"categoryId",locale,name,"updatedAt") VALUES ('cat-en','cat','en','Taxonomy',now());
      INSERT INTO "SpotCategory" ("spotId","categoryId") VALUES ('positioned','cat');
      INSERT INTO "SpotFieldDefinition" (id,"mapId",kind,label,type,"updatedAt") VALUES ('field','m','custom','CSV field','single_line_text',now());
      INSERT INTO "SpotFieldValue" (id,"spotId","fieldDefinitionId","valueJson","updatedAt") VALUES ('value','positioned','field','"CSV retained value"',now());
      INSERT INTO "SpotFieldValueTranslation" (id,"spotId","fieldDefinitionId",locale,value,"updatedAt") VALUES ('value-en','positioned','field','en','Retained translation',now());
      INSERT INTO "SpotTranslation" (id,"spotId",locale,name,"updatedAt") VALUES ('spot-en','positioned','en','CSV canonical content',now());
      INSERT INTO "SpotEditorAssignment" ("spotId","userId","assignedById","updatedAt") VALUES ('positioned','editor','editor',now());
      INSERT INTO "SpotRevision" (id,"spotId","authorId",payload,"baseVersion","updatedAt") VALUES ('pending','positioned','editor','{"name":"Pending CSV content","fieldValues":[{"fieldDefinitionId":"field","valueJson":"Pending value"}],"photoAssetIds":[]}',7,now());
      INSERT INTO "SpotDailyAnalytics" (id,"tenantId","mapId","spotId",date,"viewCount","updatedAt") VALUES ('analytics','t','m','positioned','2026-10-03',11,now());
      INSERT INTO "PublicRelease" (id,"mapId","createdBy",status,"manifestKey","readyAt") VALUES ('release','m','editor','READY','immutable/legacy-manifest.json',now());
      UPDATE "Map" SET "currentReleaseId"='release',"isPublished"=true WHERE id='m';
    `)
    await run(client, async () => {
      for (const name of migrations.filter(name => name.startsWith('2026100405'))) await client.query(await readFile(new URL(`${name}/migration.sql`, root), 'utf8'))
    })
  }
  finally {
    await client.query('ROLLBACK').catch(() => undefined)
    await client.query('SET search_path TO public')
    await client.query(`DROP SCHEMA "${schema}" CASCADE`)
    await client.end()
  }
}

integration('WU72 additive upgrade', () => {
  it('preserves canonical IDs/content/versions and backfills unplaced/unpublished rows', async () => {
    await upgrade(async (c, migrate) => {
      const before = (await c.query('SELECT id,name,x,y,"liveVersion","isPublished" FROM "Spot" ORDER BY id')).rows
      const referenceTables = ['SpotCategory', 'CategoryTranslation', 'SpotTranslation', 'SpotFieldDefinition', 'SpotFieldValue', 'SpotFieldValueTranslation', 'SpotEditorAssignment', 'SpotRevision', 'SpotDailyAnalytics', 'PublicRelease']
      const snapshotReferences = async () => {
        const rows = []
        for (const table of referenceTables) rows.push((await c.query(`SELECT row_to_json(t) value FROM "${table}" t ORDER BY row_to_json(t)::text`)).rows)
        return rows
      }
      const retained = await snapshotReferences()
      const publicPointer = (await c.query('SELECT id,slug,"isPublished","currentReleaseId" FROM "Map"')).rows

      await migrate()
      expect((await c.query('SELECT id,name,x,y,"liveVersion","isPublished" FROM "Spot" ORDER BY id')).rows).toEqual(before)
      expect(await snapshotReferences()).toEqual(retained)
      expect((await c.query('SELECT id,slug,"isPublished","currentReleaseId" FROM "Map"')).rows).toEqual(publicPointer)
      expect((await c.query(`SELECT "contentVersion" FROM "Spot" WHERE id='positioned'`)).rows[0].contentVersion).toBe(7)
      expect((await c.query('SELECT count(*)::int n FROM "MapCategoryUsage"')).rows[0].n).toBe(1)
      expect((await c.query('SELECT count(*)::int n FROM "MapSpotUsage"')).rows[0].n).toBe(2)
      expect((await c.query('SELECT count(*)::int n FROM "IllustrationPlacement"')).rows[0].n).toBe(2)
      expect((await c.query('SELECT x,y FROM "IllustrationPlacement" WHERE id=\'placement_unplaced\'')).rows[0]).toEqual({ x: null, y: null })
      await c.query(`INSERT INTO "IllustrationPlacement" (id,"usageId","floorId",x,y,"updatedAt") VALUES ('second','usage_positioned','f2',.6,.7,now()),('same-floor','usage_positioned','f2',.8,.9,now())`)
      await c.query(`UPDATE "IllustrationPlacement" SET x=.4,version=version+1 WHERE id='second'`)
      expect((await c.query('SELECT id,name,x,y,"liveVersion","isPublished" FROM "Spot" ORDER BY id')).rows).toEqual(before)
      await c.query(`DELETE FROM "MapFloor" WHERE id='f'`)
      expect((await c.query('SELECT count(*)::int n FROM "Spot"')).rows[0].n).toBe(2)
      expect((await c.query('SELECT count(*)::int n FROM "IllustrationPlacement"')).rows[0].n).toBe(2)
      await expect(c.query(`UPDATE "Spot" SET "stewardMapId"='nonconsumer' WHERE id='positioned'`)).rejects.toThrow()
      await expect(c.query(`DELETE FROM "MapSpotUsage" WHERE "spotId"='positioned'`)).rejects.toThrow()
    })
  })
})
