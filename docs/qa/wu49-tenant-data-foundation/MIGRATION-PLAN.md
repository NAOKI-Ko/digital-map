# WU-49 Migration Plan

## Forward migration

1. Add nullable `Spot.tenantId` and `Category.tenantId`.
2. Backfill Spot ownership through Floor → Map and Category ownership through Map.
3. Fail if any ownership is unresolved or if tenant-scoped Category names collide.
4. Make both ownership columns required and add Tenant foreign keys/indexes.
5. Replace Category `[mapId, name]` uniqueness with `[tenantId, name]` while retaining `mapId`.
6. Add nullable Spot `lat/lng` plus DB checks for pair/range/finite values.
7. Add Map capability fields: Illustration enabled, Real enabled, and default view; backfill existing Maps to Illustration-only.
8. Add DB checks that at least one view is enabled and the default refers to an enabled view.
9. Do not add `Map.tenantId UNIQUE`: audited QA data violates it. Reject new duplicates in application logic.
10. Add application-level transactional checks for cross-table invariants Prisma cannot express.

## Failure behavior

The migration aborts on orphan ownership, tenant Category name collisions, invalid existing coordinates, or invalid capability state. It never chooses a fallback Tenant, deletes a Map, merges data, or rewrites ownership arbitrarily.

Spot/Floor and Category/Map tenant equality, SpotCategory equality, and transitional Spot/FieldDefinition equality span tables. PostgreSQL CHECK constraints cannot express these joins. WU-49 enforces them transactionally in server services and verifies them with a read-only audit plus isolated PostgreSQL tests. The document does not claim these application invariants as DB-enforced.

## Upgrade proof

Use the verified pre-WU-49 QA dump in a disposable PostgreSQL 17 database. Apply only the new migration, then run tenant-data and IMAGE spatial audits. Separately, apply all migrations from zero to a fresh database. Both paths must pass before any Windows QA migration.

## Recovery

Prisma migrations are forward-only operationally. Before Windows migration:

- record active SHA and migration status;
- create and verify DB and media backups;
- retain all old releases/backups.

If migration or validation fails, do not edit rows to force success. Stop the candidate, keep the old release active, and restore the verified DB/media backup to a separately confirmed target according to `docs/operations/backup-restore.md`. A destructive down migration is intentionally not provided.
