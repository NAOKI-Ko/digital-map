import { prisma } from '../../server/utils/prisma'

async function main() {
  const [
    mapCount,
    fieldDefinitionCount,
    spotFieldValueCount,
    fieldTranslationCount,
    englishFieldTranslationCount,
    mapsWithoutDefaultLocale,
    mapsWithoutEnabledDefault,
    fieldsWithoutLabel,
    duplicateTranslationKeys,
  ] = await Promise.all([
    prisma.map.count(),
    prisma.spotFieldDefinition.count(),
    prisma.spotFieldValue.count(),
    prisma.spotFieldDefinitionTranslation.count(),
    prisma.spotFieldDefinitionTranslation.count({ where: { locale: 'en' } }),
    prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) AS count FROM "Map" WHERE "defaultLocale" IS NULL OR BTRIM("defaultLocale") = ''`,
    prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) AS count FROM "Map" WHERE NOT ("defaultLocale" = ANY("enabledLocales"))`,
    prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) AS count FROM "SpotFieldDefinition" WHERE BTRIM("label") = ''`,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM (
        SELECT "fieldDefinitionId", "locale"
        FROM "SpotFieldDefinitionTranslation"
        GROUP BY "fieldDefinitionId", "locale"
        HAVING COUNT(*) > 1
      ) duplicates
    `,
  ])

  const count = (rows: Array<{ count: bigint }>) => Number(rows[0]?.count ?? 0n)
  const result = {
    mapCount,
    fieldDefinitionCount,
    spotFieldValueCount,
    fieldTranslationCount,
    englishFieldTranslationCount,
    mapsWithoutDefaultLocale: count(mapsWithoutDefaultLocale),
    mapsWithoutEnabledDefault: count(mapsWithoutEnabledDefault),
    fieldsWithoutLabel: count(fieldsWithoutLabel),
    duplicateTranslationKeys: count(duplicateTranslationKeys),
  }
  console.log(JSON.stringify(result, null, 2))
  if (result.mapsWithoutDefaultLocale || result.mapsWithoutEnabledDefault || result.fieldsWithoutLabel || result.duplicateTranslationKeys) process.exitCode = 1
}

main().finally(() => prisma.$disconnect())
