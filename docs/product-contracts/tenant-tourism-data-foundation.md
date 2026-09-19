# Tenant Tourism Data Foundation

Tenant is the canonical tourism-data boundary.

- Spot is Tenant-owned.
- Category is Tenant-owned.
- Media is Tenant-owned.
- The target product contract is one standard Map per Tenant.
- A Map may enable Illustration view, Real view, or both.
- Illustration position is `MapFloor + x/y`.
- Real-world position is nullable `lat/lng`.
- Web and Map consumers reuse the same Spot and Category rows; they do not copy tourism data.

## Transitional WU-49 storage

The transitional schema deliberately retains compatibility relations:

- Spot keeps mandatory `floorId` and nullable `x/y`. Its `tenantId` must equal the Floor's Map tenant.
- Category keeps `mapId`. Its `tenantId` must equal the Map tenant.
- Existing Map-scoped routes remain compatibility APIs and validate the canonical tenant.
- `SpotFieldDefinition` remains Map-owned. A future migration must decide how tenant-owned definitions and per-view presentation interact before changing it.
- Existing QA data contains a Tenant with multiple Maps. WU-49 does not delete, merge, or silently reassign those Maps, so DB-level one-to-one uniqueness is staged rather than falsely claimed.

This compatibility storage is not the final ideal architecture. A later approved migration may extract Illustration placement from Spot and remove Category's Map relation after all consumers and real data are migrated.

## Map capability rules

- At least one of Illustration or Real view is enabled.
- The default view must be enabled.
- Existing Maps migrate to Illustration enabled, Real disabled, default Illustration.
- Enabling both views does not create a second Map.

## Coordinate rules

`lat/lng` are independent of `x/y`:

- both `lat` and `lng` are null, or both are finite numbers;
- `-90 <= lat <= 90`;
- `-180 <= lng <= 180`;
- changing real coordinates does not derive or overwrite Illustration coordinates.
