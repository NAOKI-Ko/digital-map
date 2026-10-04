import 'dotenv/config'
import { Client } from 'pg'
const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is required')
const client = new Client({ connectionString: url })
const queries = {
  consumerSteward: `SELECT s.id FROM "Spot" s LEFT JOIN "MapSpotUsage" u ON u."spotId"=s.id LEFT JOIN "Map" m ON m.id=u."mapId" WHERE (s."stewardMapId" IS NOT NULL AND s."stewardMapId" IS DISTINCT FROM u."mapId") OR (u.id IS NOT NULL AND (s."tenantId"<>m."tenantId" OR s."schemaMapId" IS DISTINCT FROM m.id))`,
  placementMap: `SELECT p.id FROM "IllustrationPlacement" p JOIN "MapSpotUsage" u ON u.id=p."usageId" JOIN "MapFloor" f ON f.id=p."floorId" WHERE u."mapId"<>f."mapId"`,
  primaryProjection: `SELECT s.id FROM "Spot" s LEFT JOIN "MapSpotUsage" u ON u."spotId"=s.id LEFT JOIN "IllustrationPlacement" p ON p."usageId"=u.id AND p."isPrimary" WHERE ROW(s."floorId",s.x,s.y) IS DISTINCT FROM ROW(p."floorId",p.x,p.y)`,
  appearanceProjection: `SELECT s.id FROM "Spot" s JOIN "MapSpotUsage" u ON u."spotId"=s.id WHERE ROW(s."isPublished",s.importance,s."pinSourceMode",s."pinSourceCategoryId",s."pinIconType",s."pinIconId",s."pinIconImageUrl",s."pinIconAssetId",s."pinColor",s."pinSize") IS DISTINCT FROM ROW(u."isPublished",u.importance,u."pinSourceMode",u."pinSourceCategoryId",u."pinIconType",u."pinIconId",u."pinIconImageUrl",u."pinIconAssetId",u."pinColor",u."pinSize")`,
  categoryConsumer: `SELECT c.id FROM "Category" c JOIN "MapCategoryUsage" u ON u."categoryId"=c.id JOIN "Map" m ON m.id=u."mapId" WHERE c."mapId" IS DISTINCT FROM u."mapId" OR c."tenantId"<>m."tenantId"`,
  customFieldSchema: `SELECT v.id FROM "SpotFieldValue" v JOIN "Spot" s ON s.id=v."spotId" JOIN "SpotFieldDefinition" d ON d.id=v."fieldDefinitionId" WHERE s."schemaMapId" IS DISTINCT FROM d."mapId"`,
  translatedFieldSchema: `SELECT v.id FROM "SpotFieldValueTranslation" v JOIN "Spot" s ON s.id=v."spotId" JOIN "SpotFieldDefinition" d ON d.id=v."fieldDefinitionId" WHERE s."schemaMapId" IS DISTINCT FROM d."mapId"`,
}
try {
  await client.connect()
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  const anomalies: Record<string, unknown[]> = {}
  for (const [key, sql] of Object.entries(queries)) anomalies[key] = (await client.query(sql)).rows
  const counts = (await client.query(`SELECT (SELECT count(*) FROM "Spot") spots,(SELECT count(*) FROM "MapSpotUsage") usages,(SELECT count(*) FROM "IllustrationPlacement") placements,(SELECT count(*) FROM "MapCategoryUsage") category_usages`)).rows[0]
  await client.query('ROLLBACK')
  console.log(JSON.stringify({ counts, anomalies }, null, 2))
  if (Object.values(anomalies).some(rows => rows.length)) process.exitCode = 1
}
finally { await client.end() }
