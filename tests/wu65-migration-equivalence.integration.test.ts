// @vitest-environment happy-dom
import { Client } from 'pg'
import { describe, expect, it } from 'vitest'
import { createSpotMarkerElement } from '../app/utils/marker-element'
import { resolveEffectivePinAppearance } from '../shared/utils/pin-appearance'
import type { MapViewerSpot } from '../shared/types/map-viewer'

const beforeUrl = process.env.WU65_BEFORE_DATABASE_URL
const afterUrl = process.env.WU65_AFTER_DATABASE_URL
const integration = beforeUrl && afterUrl ? describe : describe.skip
integration('WU65 actual restored backup appearance gate', () => {
  it('preserves every Aquarium and Arimatsu marker DOM, asset reference and coordinate', async () => {
    for (const [url, database] of [[beforeUrl, 'digital_map_test_wu65_before'], [afterUrl, 'digital_map_test_wu65_after']]) {
      const parsed = new URL(url!)
      if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || parsed.pathname !== `/${database}`) throw new Error('Only dedicated local comparison databases are allowed')
    }
    const before = new Client({ connectionString: beforeUrl }); const after = new Client({ connectionString: afterUrl })
    await before.connect(); await after.connect()
    try {
      const columns = 's.id, s.name, s."floorId", s.x, s.y, s.lat, s.lng, s."pinIconType", s."pinIconId", s."pinIconImageUrl", s."pinIconAssetId", s."pinColor", s."pinSize", s.importance, s."isPublished", m.name AS "mapName"'
      const join = 'FROM "Spot" s JOIN "MapFloor" f ON f.id=s."floorId" JOIN "Map" m ON m.id=f."mapId" ORDER BY s.id'
      const oldRows = (await before.query(`SELECT ${columns} ${join}`)).rows
      const newRows = (await after.query(`SELECT ${columns}, s."pinSourceMode", s."pinSourceCategoryId" ${join}`)).rows
      expect(oldRows.filter(row => row.mapName.includes('名古屋港水族館'))).toHaveLength(37)
      expect(oldRows.filter(row => row.mapName.includes('有松'))).toHaveLength(52)
      expect(newRows).toHaveLength(oldRows.length)
      for (const [index, row] of newRows.entries()) {
        const { pinSourceMode, pinSourceCategoryId, ...existing } = row
        expect(pinSourceMode).toBe('individual'); expect(pinSourceCategoryId).toBeNull()
        expect(existing).toEqual(oldRows[index])
        const oldMarker = { ...oldRows[index], categories: [] } as MapViewerSpot
        const newMarker = { ...row, ...resolveEffectivePinAppearance(row), categories: [] } as MapViewerSpot
        for (const mode of ['view', 'edit'] as const) {
          expect(createSpotMarkerElement(newMarker, { mode, selected: false }).outerHTML)
            .toBe(createSpotMarkerElement(oldMarker, { mode, selected: false }).outerHTML)
        }
      }
    }
    finally { await before.end(); await after.end() }
  })
})
