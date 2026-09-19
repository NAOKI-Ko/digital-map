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
9. After the approved fixed-ID Windows QA cleanup, apply explicit migration `20260920020000_map_tenant_unique`. It fails if any Tenant still has multiple Maps, replaces `Map_tenantId_idx` with unique `Map_tenantId_key`, and permits onboarding Tenants with zero Maps.
10. Retain the application advisory lock and add application-level transactional checks for cross-table invariants Prisma cannot express. The database unique index is authoritative for the Map maximum-one invariant.

## Failure behavior

The ownership migration aborts on orphan ownership, tenant Category name collisions, invalid existing coordinates, or invalid capability state. The hard 1:1 migration aborts if duplicate `Map.tenantId` values remain. Neither migration chooses a fallback Tenant, deletes a Map, merges data, or rewrites ownership arbitrarily. The separately approved Windows QA cleanup uses only the four fixed Map IDs documented in the preflight audit.

Spot/Floor and Category/Map tenant equality, SpotCategory equality, and transitional Spot/FieldDefinition equality span tables. PostgreSQL CHECK constraints cannot express these joins. WU-49 enforces them transactionally in server services and verifies them with a read-only audit plus isolated PostgreSQL tests. The document does not claim these application invariants as DB-enforced.

## Upgrade proof

Use the verified pre-cleanup QA dump in a disposable PostgreSQL 17 database, replay the same fixed-ID cleanup transaction, then apply migrations 29 and 30 and run tenant-data and IMAGE spatial audits. Separately, apply all 30 migrations from zero to a fresh database. Both paths must pass before Windows QA migration.

Both paths passed. Windows QA applied all 30 migrations and now runs exact implementation SHA `cfdaa7dedcdc8e24bf5dd5bd8123f198451e6945`; `Map_tenantId_key` is active, every Tenant has at most one Map, and direct/concurrent second-Map tests passed in the isolated PostgreSQL suite.

The post-deploy backup was independently restored to disposable PostgreSQL and empty media targets. Migration deploy/status, tenant-data audit, IMAGE spatial audit, exact media-manifest verification, retained row counts, and restored-app readiness all passed before only those disposable targets were removed.

## Recovery

Prisma migrations are forward-only operationally. Before Windows migration:

- record active SHA and migration status;
- create and verify DB and media backups;
- retain all old releases/backups.

If migration or validation fails, do not edit rows to force success. Stop the candidate, keep the old release active, and restore the verified DB/media backup to a separately confirmed target according to `docs/operations/backup-restore.md`. A destructive down migration is intentionally not provided.

The retained recovery points include the pre-cleanup backup `pre-wu49-cleanup-7c57e57-20260920-053426`, the earlier post-deploy backup `post-wu49-unblock-8c4675e-20260920-064305`, the final verified backup `post-wu49-unblock-cfdaa7d-20260920-072846`, and all pre-existing release/backup folders.
