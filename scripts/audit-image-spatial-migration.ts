import 'dotenv/config'
import { Client } from 'pg'
import {
  hasCompleteLegacyGeoReference,
  invertLegacySpotPosition,
  isMigrationImagePositionInBounds,
  normalizeLegacyFloorReference,
  type LegacyFloorSpatialFields,
} from '../lib/image-spatial-migration'
import {
  getCompleteFloorGeoReference,
  getGeoReferenceValidationError,
  IMAGE_SPATIAL_MIGRATION_EPSILON,
} from '../lib/geo'

interface FloorRow extends LegacyFloorSpatialFields {
  id: string
  mapId: string
  illustrationUrl: string
  positionedSpotCount: number
}

interface SpotRow {
  id: string
  floorId: string
  name: string
  lat: number | null
  lng: number | null
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is required for the read-only IMAGE spatial migration audit.')
  process.exitCode = 2
}
else {
  const client = new Client({ connectionString: databaseUrl })
  try {
    await client.connect()
    await client.query('BEGIN TRANSACTION READ ONLY')
    let exceptionCount = 0
    const imageSchema = (await client.query<{ present: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'Spot' AND column_name = 'x'
      ) AS present
    `)).rows[0]?.present === true

    if (imageSchema) {
      const invalidFloors = (await client.query(`SELECT "id", "mapId", "imageWidth", "imageHeight" FROM "MapFloor" WHERE "imageWidth" <= 0 OR "imageHeight" <= 0 ORDER BY "mapId", "id"`)).rows
      const partialSpots = (await client.query(`SELECT "id", "floorId", "name", "x", "y" FROM "Spot" WHERE ("x" IS NULL) <> ("y" IS NULL) ORDER BY "floorId", "id"`)).rows
      const outsideSpots = (await client.query(`SELECT "id", "floorId", "name", "x", "y" FROM "Spot" WHERE "x" < 0 OR "x" > 1 OR "y" < 0 OR "y" > 1 ORDER BY "floorId", "id"`)).rows
      const invalidReferences = (await client.query(`SELECT "id", "mapId", "refAImageX", "refAImageY", "refBImageX", "refBImageY" FROM "MapFloor" WHERE ("refAImageX" IS NOT NULL AND ("refAImageX" < 0 OR "refAImageX" > 1)) OR ("refAImageY" IS NOT NULL AND ("refAImageY" < 0 OR "refAImageY" > 1)) OR ("refBImageX" IS NOT NULL AND ("refBImageX" < 0 OR "refBImageX" > 1)) OR ("refBImageY" IS NOT NULL AND ("refBImageY" < 0 OR "refBImageY" > 1)) ORDER BY "mapId", "id"`)).rows
      const publishedUnpositionedSpots = (await client.query(`SELECT "id", "floorId", "name" FROM "Spot" WHERE "isPublished" AND ("x" IS NULL OR "y" IS NULL) ORDER BY "floorId", "id"`)).rows
      console.log(JSON.stringify({ schema: 'IMAGE', invalidFloors, invalidReferences, partialSpots, outsideSpots, publishedUnpositionedSpots }, null, 2))
      exceptionCount = invalidFloors.length + invalidReferences.length + partialSpots.length + outsideSpots.length
    }
    else {
      const floors = (await client.query<FloorRow>(`
      SELECT f."id", f."mapId", f."illustrationUrl", f."imageWidth", f."imageHeight",
        f."refAPixelX", f."refAPixelY", f."refALat", f."refALng",
        f."refBPixelX", f."refBPixelY", f."refBLat", f."refBLng",
        COUNT(s."id") FILTER (WHERE s."lat" IS NOT NULL AND s."lng" IS NOT NULL)::int AS "positionedSpotCount"
      FROM "MapFloor" f
      LEFT JOIN "Spot" s ON s."floorId" = f."id"
      GROUP BY f."id"
      ORDER BY f."mapId", f."id"
    `)).rows
    const spots = (await client.query<SpotRow>(`
      SELECT "id", "floorId", "name", "lat", "lng"
      FROM "Spot"
      WHERE "lat" IS NOT NULL OR "lng" IS NOT NULL
      ORDER BY "floorId", "id"
    `)).rows

    const invalidFloors = floors.filter(floor => floor.imageWidth <= 0 || floor.imageHeight <= 0)
    const partialSpots = spots.filter(spot => (spot.lat === null) !== (spot.lng === null))
    const invalidReferences = floors.flatMap((floor) => {
      if (floor.imageWidth <= 0 || floor.imageHeight <= 0) return []

      const normalized = normalizeLegacyFloorReference(floor)
      const referenceValues = {
        refAImageX: normalized.refAImageX,
        refAImageY: normalized.refAImageY,
        refBImageX: normalized.refBImageX,
        refBImageY: normalized.refBImageY,
      }
      const outOfBounds = Object.entries(referenceValues)
        .filter(([, value]) => value !== null && (
          !Number.isFinite(value)
          || value < -IMAGE_SPATIAL_MIGRATION_EPSILON
          || value > 1 + IMAGE_SPATIAL_MIGRATION_EPSILON
        ))
        .map(([field, value]) => ({ field, value }))

      let validationError: string | null = null
      if (hasCompleteLegacyGeoReference(floor)) {
        const complete = getCompleteFloorGeoReference(normalized)
        validationError = complete
          ? getGeoReferenceValidationError(complete)
          : '基準点の値を確認してください。'
      }

      if (outOfBounds.length === 0 && validationError === null) return []
      return [{ floorId: floor.id, mapId: floor.mapId, outOfBounds, validationError }]
    })
    const floorsById = new Map(floors.map(floor => [floor.id, floor]))
    const transformErrors: Array<SpotRow & { reason: string }> = []
    const outsideSpots = spots.flatMap((spot) => {
      if (spot.lat === null || spot.lng === null) return []
      const floor = floorsById.get(spot.floorId)
      if (!floor) {
        transformErrors.push({ ...spot, reason: 'Floor record not found' })
        return []
      }
      if (floor.imageWidth <= 0 || floor.imageHeight <= 0) return []
      const position = invertLegacySpotPosition(floor, { lat: spot.lat, lng: spot.lng })
      if (!position) {
        transformErrors.push({ ...spot, reason: 'Current Floor render transform is not invertible' })
        return []
      }
      if (isMigrationImagePositionInBounds(position)) return []
      return [{ ...spot, rawX: position.x, rawY: position.y }]
    })

      console.log(JSON.stringify({ schema: 'LEGACY_GEO', invalidFloors, invalidReferences, partialSpots, outsideSpots, transformErrors }, null, 2))
      exceptionCount = invalidFloors.length + invalidReferences.length
        + partialSpots.length + outsideSpots.length + transformErrors.length
    }
    await client.query('ROLLBACK')

    if (exceptionCount > 0) {
      console.error(`IMAGE spatial migration audit failed with ${exceptionCount} unresolved exception(s).`)
      process.exitCode = 1
    }
    else {
      console.log('IMAGE spatial migration audit passed with zero unresolved exceptions.')
    }
  }
  catch (error) {
    console.error('IMAGE spatial migration audit could not complete.', error)
    process.exitCode = 2
  }
  finally {
    await client.end().catch(() => undefined)
  }
}
