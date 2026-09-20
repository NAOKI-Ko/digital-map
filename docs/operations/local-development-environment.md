# Unified local development environment

## Canonical topology

```text
one canonical Git clone
  -> one active WU branch
  -> Compose project digital-map-local
       -> PostgreSQL volume
       -> .local-data/uploads
       -> .local-data/public
```

The canonical database is `digital_map`. Managed Media and Local Public Storage are Git-ignored bind-mounted directories so host Nuxt and the Docker app see the same files.
They are also excluded from the Docker build context, so local content is never copied into an image layer.

## Normal development loop

```bash
cp .env.example .env
pnpm local:db
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm exec prisma migrate deploy
pnpm dev
```

This runs PostgreSQL in Docker and Nuxt on the host for HMR. Do not also run the Docker app on port 3000.

## Full Docker smoke

Stop host Nuxt, then run:

```bash
pnpm local:full
pnpm local:status
pnpm local:logs
```

The `app` service is behind the `full` profile. Rebuilds and recreates reuse the same PostgreSQL volume and `.local-data` bind mounts.
The Compose app explicitly identifies itself as a development deployment at both config-build and Nitro runtime layers, uses localhost base URLs, and enables the local fake mail provider. Production HTTPS validation remains unchanged.

## Safe stopping

```bash
pnpm local:down
```

This is equivalent to `docker compose --profile full down` and retains data volumes. `docker compose down -v` destroys PostgreSQL data and is prohibited in ordinary work.

## Disposable integration databases

Use the same PostgreSQL service with a short-lived database such as `digital_map_test_<shortsha>`. Run migrations, tests, and audits there, then drop only that disposable database. Never point destructive integration tooling at canonical `digital_map`.

## Migration policy

1. Validate a new migration on a disposable DB.
2. Run tests and audits there.
3. Back up canonical DB, Managed Media, and Public Storage.
4. Apply the migration intentionally to `digital_map` only during integrated local/browser verification.
5. Do not switch canonical data backward across incompatible schema histories.

## Backups and old stacks

Before removing an old project, container, network, or volume, inspect its mounts and prove it has no unique DB, Media, Public Storage, credentials, or recovery artifacts. Keep verified backups outside Git. Cleanup follows successful restore and persistence verification, never precedes it.
