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
      await migrate()
      expect((await c.query('SELECT id,name,x,y,"liveVersion","isPublished" FROM "Spot" ORDER BY id')).rows).toEqual(before)
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
